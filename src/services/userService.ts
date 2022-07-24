import { User } from "../types";

export const UserService = {
  createUser: (username: string, socketId: string): User => {
    return {
      id: socketId,
      name: username,
      isReady: false,
      room: null,
      progress: 0,
      time: 0,
    };
  },

  isActiveUser: (activeUsers: User[], username: string): User | undefined => {
    return activeUsers.find((user) => user.name == username);
  },

  deleteUser: (activeUsers: User[], socketId: string): User[] => {
    return activeUsers.filter((user) => {
      return user.id != socketId;
    });
  },

  addUserRoom: (activeUsers: User[], socketId: string, roomName: string): User[] => {
    return activeUsers.map((user) =>
      user.id === socketId
        ? {
            id: socketId,
            name: user.name,
            isReady: user.isReady,
            room: roomName,
            progress: user.progress,
            time: user.time,
          }
        : user
    );
  },

  removeUserRoom: (activeUsers: User[], socketId: string): User[] => {
    return activeUsers.map((user) =>
      user.id === socketId
        ? {
            id: socketId,
            name: user.name,
            isReady: user.isReady,
            room: null,
            progress: user.progress,
            time: user.time,
          }
        : user
    );
  },

  getUser: (activeUsers: User[], socketId: string): User | undefined => {
    return activeUsers.find((user) => {
      return user.id === socketId;
    });
  },

  getUsersFromRoom: (activeUsers: User[], roomName: string): User[] => {
    return activeUsers.filter((user) => user.room === roomName);
  },

  updateUserStatus: (activeUsers: User[], socketId: string, ready: boolean): User[] => {
    return activeUsers.map((user) =>
      user.id === socketId
        ? { id: user.id, name: user.name, isReady: ready, progress: user.progress, room: user.room, time: user.time }
        : user
    );
  },

  usersStatus: function (activeUsers: User[], roomName: string): boolean {
    const usersFromRoom = this.getUsersFromRoom(activeUsers, roomName);

    return usersFromRoom.every((user) => user.isReady === true);
  },

  resetUserStatus: (activeUsers: User[], roomName: string): User[] => {
    return activeUsers.map((user) =>
      roomName === user.room
        ? { id: user.id, name: user.name, isReady: false, progress: 0, room: user.room, time: 0 }
        : user
    );
  },

  updateUserProgress: (activeUsers: User[], socketId: string, userProgress) => {
    const { progress, time } = userProgress;

    return activeUsers.map((user) =>
      user.id === socketId
        ? {
            id: user.id,
            name: user.name,
            isReady: user.isReady,
            progress,
            room: user.room,
            time,
          }
        : user
    );
  },
};
