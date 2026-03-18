import { ref, watch, readonly } from 'vue'
import { useStomp } from './useStomp'
import { useApi } from './useApi'
import { useRobotId } from './useRobotId'
import { useRobotControl } from './useRobotControl'

const mapData = ref(null)
const globalPath = ref([])
const navStatus = ref({ status: 'idle', distance: null, goalX: null, goalY: null, goalTheta: null })

let subscribedFor = null
let lastMapRevision = -1

async function fetchMap() {
  try {
    const { get, robotId } = useApi()
    const data = await get(`/api/${robotId.value}/map`)
    if (data.error) return

    mapData.value = {
      image: data.image,  // base64 PNG
      width: data.width,
      height: data.height,
      resolution: data.resolution,
      origin: {
        position: { x: data.origin_x, y: data.origin_y },
        orientation: { yaw: data.origin_yaw }
      }
    }
    lastMapRevision = data.revision
  } catch {
    // ignore fetch errors
  }
}

function teardown(rid) {
  const { unsubscribe } = useStomp()
  unsubscribe(`${rid}/map_updated`)
  unsubscribe(`${rid}/path`)
  unsubscribe(`${rid}/nav_status`)
}

function resetState() {
  mapData.value = null
  globalPath.value = []
  navStatus.value = { status: 'idle', distance: null, goalX: null, goalY: null, goalTheta: null }
  lastMapRevision = -1
}

function setup(rid) {
  const { subscribe, addLog } = useStomp()

  // Refresh map when notified
  subscribe(`${rid}/map_updated`, (data) => {
    if (data.revision !== lastMapRevision) {
      fetchMap()
    }
  })

  // Path updates
  subscribe(`${rid}/path`, (data) => {
    const poses = data.poses || []
    globalPath.value = poses
    if (poses.length > 0) {
      addLog('info', `NAV Path: ${poses.length} waypoints`)
    }
  })

  // Nav status
  let prevNavStatus = 'idle'
  subscribe(`${rid}/nav_status`, (data) => {
    navStatus.value = {
      status: data.status || 'idle',
      distance: data.feedback_distance ?? null,
      goalX: data.goal_x ?? null,
      goalY: data.goal_y ?? null,
      goalTheta: data.goal_theta ?? null,
    }
    const s = data.status || 'idle'
    if (s !== prevNavStatus) {
      if (s === 'succeeded') addLog('info', 'NAV Arrived')
      else if (s === 'failed') addLog('error', 'NAV Failed')
      else if (s === 'canceled') addLog('warn', 'NAV Canceled')
      prevNavStatus = s
    }
    if (s === 'succeeded' || s === 'failed' || s === 'canceled') {
      globalPath.value = []
    }
  })

  // Initial map fetch
  fetchMap()
}

function publishNavGoal(x, y, theta) {
  const { publishNavigate } = useRobotControl()
  const { addLog } = useStomp()
  const deg = (theta * 180 / Math.PI).toFixed(1)
  addLog('info', `NAV Goal: (${x.toFixed(2)}, ${y.toFixed(2)}) heading ${deg}°`)
  publishNavigate(x, y, theta)
}

function cancelNavigation() {
  const { publishCancel } = useRobotControl()
  publishCancel()
}

export function useMap() {
  const { isConnected } = useStomp()
  const { robotId } = useRobotId()

  watch([isConnected, robotId], ([connected, rid]) => {
    if (subscribedFor) {
      teardown(subscribedFor)
      subscribedFor = null
    }
    if (connected && rid) {
      resetState()
      setup(rid)
      subscribedFor = rid
    }
  }, { immediate: true })

  return {
    mapData: readonly(mapData),
    globalPath: readonly(globalPath),
    navStatus: readonly(navStatus),
    publishNavGoal,
    cancelNavigation
  }
}
