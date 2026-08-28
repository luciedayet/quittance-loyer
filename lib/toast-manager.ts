import { Toast } from "@base-ui/react/toast"

/** Manager global : permet de déclencher des toasts en dehors du rendu React. */
export const toastManager = Toast.createToastManager()
