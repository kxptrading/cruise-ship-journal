// Shared TypeScript types for the Chat section sub-components.

export interface MemberProfile {
  name:      string
  avatarUrl: string
}

export interface Message {
  id:         string
  user_id:    string
  body:       string
  created_at: string
}

export interface Conversation {
  id:             string
  type:           string
  name:           string | null
  created_at:     string
  displayName:    string
  otherUser:      MemberProfile | null
  members:        string[]
  otherMemberIds: string[]
  lastMessage:    Message | null
  unreadCount:    number
}

export interface FriendItem {
  userId:    string
  name:      string
  avatarUrl: string
}
