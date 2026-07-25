export interface Story {
  id: number
  title: string
  url?: string
  by: string
  score: number
  time: number
  descendants?: number
  kids?: number[]
}

export interface Comment {
  id: number
  by?: string
  text?: string
  time: number
  kids?: number[]
  deleted?: boolean
  dead?: boolean
}
