import { ref } from 'vue'

const isVisible = ref(false)
const message = ref('')

function showToast(text: string): void {
  message.value = text
  isVisible.value = false
  requestAnimationFrame(() => {
    isVisible.value = true
  })
}

export function useToast() {
  return {
    isVisible,
    message,
    showToast
  }
}
