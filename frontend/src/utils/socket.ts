import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    socket = io(`${baseUrl}/dashboard`, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });
  }
  return socket;
};

export const connectSocket = (token: string | null) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      s.emit('authenticate', token);
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
