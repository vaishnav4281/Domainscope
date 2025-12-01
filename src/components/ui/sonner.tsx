import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-slate-800/95 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-50 group-[.toaster]:border group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-700 group-[.toaster]:shadow-lg backdrop-blur-sm",
          description: "group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-700 group-[.toast]:text-slate-900 dark:group-[.toast]:text-slate-100",
          success: "group-[.toast]:bg-emerald-50/95 dark:group-[.toast]:bg-emerald-950/50 group-[.toast]:text-emerald-900 dark:group-[.toast]:text-emerald-100 group-[.toast]:border-emerald-200 dark:group-[.toast]:border-emerald-800",
          error: "group-[.toast]:bg-red-50/95 dark:group-[.toast]:bg-red-950/50 group-[.toast]:text-red-900 dark:group-[.toast]:text-red-100 group-[.toast]:border-red-200 dark:group-[.toast]:border-red-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
