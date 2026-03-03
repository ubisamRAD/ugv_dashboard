import { ref, watch, readonly } from 'vue'
import { useMqtt } from './useMqtt'
import { useApi } from './useApi'

const ROBOT_ID = 'ugv01'

const mapData = ref(null)
const globalPath = ref([])
const navStatus = ref({ status: 'idle', distance: null, goalX: null, goalY: null, goalTheta: null })

let subscribed = false
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

function setupSubscriptions() {
  if (subscribed) return
  subscribed = true

  const { subscribe, addLog } = useMqtt()

  // Refresh map when notified
  subscribe(`${ROBOT_ID}/map_updated`, (data) => {
    if (data.revision !== lastMapRevision) {
      fetchMap()
    }
  })

  // Path updates
  subscribe(`${ROBOT_ID}/path`, (data) => {
    const poses = data.poses || []
    globalPath.value = poses
    if (poses.length > 0) {
      addLog('info', `NAV Path: ${poses.length} waypoints`)
    }
  })

  // Nav status
  let prevNavStatus = 'idle'
  subscribe(`${ROBOT_ID}/nav_status`, (data) => {
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
  const { post, robotId } = useApi()
  const { addLog } = useMqtt()
  const deg = (theta * 180 / Math.PI).toFixed(1)
  addLog('info', `NAV Goal: (${x.toFixed(2)}, ${y.toFixed(2)}) heading ${deg}°`)
  post(`/api/${robotId.value}/navigate`, { x, y, theta })
}

function cancelNavigation() {
  const { post, robotId } = useApi()
  post(`/api/${robotId.value}/cancel`)
}

export function useMap() {
  const { isConnected } = useMqtt()

  watch(isConnected, (connected) => {
    if (connected) {
      setupSubscriptions()
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
