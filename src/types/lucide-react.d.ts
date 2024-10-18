declare module 'lucide-react' {
    import { FC, SVGProps } from 'react'
  
    export interface IconProps extends SVGProps<SVGSVGElement> {
      size?: number | string
      color?: string
      stroke?: number | string
    }
  
    export type Icon = FC<IconProps>
  
    export const Plus: Icon
    export const Edit2: Icon
    export const Trash2: Icon
    export const Eye: Icon
    export const FileText: Icon
    export const Printer: Icon
    export const Calendar: Icon
    export const X: Icon
    export const Check: Icon
    export const ChevronDown: Icon
    // Fügen Sie hier weitere Icons hinzu, die Sie in Ihrem Projekt verwenden
  }