import { ref, watch, readonly } from 'vue'
import { useFactoryApi } from './useFactoryApi'
import { useStomp } from './useStomp'
import { useRobotId } from './useRobotId'

const tasks = ref([])
const loading = ref(false)

let subscribedFor = null

function teardown(rid) {
  const { unsubscribe } = useStomp()
  unsubscribe(`factory/${rid}/task_status`)
}

function setup(rid) {
  const { subscribe } = useStomp()
  subscribe(`factory/${rid}/task_status`, (data) => {
    const idx = tasks.value.findIndex((t) => t.id === data.id)
    if (idx >= 0) {
      tasks.value[idx] = { ...tasks.value[idx], ...data }
    }
  })
}

export function useTaskQueue() {
  const { get, post, patch, del } = useFactoryApi()
  const { isConnected } = useStomp()
  const { robotId } = useRobotId()

  watch([isConnected, robotId], ([connected, rid]) => {
    if (subscribedFor) {
      teardown(subscribedFor)
      subscribedFor = null
    }
    if (connected && rid) {
      tasks.value = []
      setup(rid)
      subscribedFor = rid
    }
  }, { immediate: true })

  async function fetchTasks(status = null) {
    loading.value = true
    const query = status ? `?status=${status}` : ''
    const data = await get(`/api/tasks${query}`)
    if (!data?.error) {
      tasks.value = data
    }
    loading.value = false
  }

  async function createTask(taskData) {
    const result = await post('/api/tasks', taskData)
    if (!result?.error) {
      tasks.value.unshift(result)
    }
    return result
  }

  async function updateTask(id, updates) {
    const result = await patch(`/api/tasks/${id}`, updates)
    if (!result?.error) {
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx >= 0) tasks.value[idx] = result
    }
    return result
  }

  async function deleteTask(id) {
    await del(`/api/tasks/${id}`)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function executeTask(id) {
    const result = await post(`/api/tasks/${id}/execute`)
    if (!result?.error) {
      const idx = tasks.value.findIndex((t) => t.id === id)
      if (idx >= 0) tasks.value[idx] = result
    }
    return result
  }

  return {
    tasks: readonly(tasks),
    loading: readonly(loading),
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    executeTask
  }
}
