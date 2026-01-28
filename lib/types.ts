export interface User {
  id: string
  username: string
  pin_code: string
  role: 'admin' | 'user'
  created_at: string
}

export interface City {
  id: string
  name: string
  region: string
  created_at: string
}

export interface Enterprise {
  id: string
  city_id: string
  name: string
  address: string
  contact_phone: string | null
  contact_email: string | null
  created_at: string
  city?: City
}

export interface Device {
  id: string
  enterprise_id: string
  name: string
  device_type: 'router' | 'switch' | 'server' | 'workstation' | 'firewall' | 'access_point'
  ip_address: string | null
  mac_address: string | null
  login: string | null
  password: string | null
  status: 'online' | 'offline' | 'maintenance'
  position_x: number
  position_y: number
  created_at: string
  enterprise?: Enterprise
}

export interface NetworkConnection {
  id: string
  source_device_id: string
  target_device_id: string
  connection_type: 'ethernet' | 'fiber' | 'wireless'
  bandwidth: string | null
  created_at: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}
