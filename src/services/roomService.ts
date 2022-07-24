import { MAXIMUM_USERS_FOR_ONE_ROOM } from "../socket/config";
import { Room } from "../types";

export const RoomService = {
  createRoom: (roomName: string, count: number): Room => {
    return {
      name: roomName,
      numberOfUsers: count,
      isFull: false,
      timerStarted: false,
    };
  },
  deleteRoom: (activeRooms: Room[], roomName): Room[] => {
    return activeRooms.filter((room) => {
      return room.name != roomName;
    });
  },
  isActiveRoom: (activeRooms: Room[], roomName: string): Room | undefined => {
    return activeRooms.find((room) => room.name == roomName);
  },
  updateNumberOfUsers: (activeRooms: Room[], roomName: string, diff: number): Room[] => {
    return activeRooms.map((room) =>
      room.name === roomName
        ? {
            name: room.name,
            numberOfUsers: room.numberOfUsers + diff,
            isFull: room.numberOfUsers + diff === MAXIMUM_USERS_FOR_ONE_ROOM,
            timerStarted: room.timerStarted,
          }
        : room
    );
  },
  getRoom: (activeRooms: Room[], roomName: string): Room | undefined => {
    return activeRooms.find((room) => {
      return room.name === roomName;
    });
  },
  updateRoomTimerStatus: (activeRooms: Room[], roomName: string, status: boolean): Room[] => {
    return activeRooms.map((room) =>
      room.name === roomName
        ? {
            name: room.name,
            numberOfUsers: room.numberOfUsers,
            isFull: room.isFull,
            timerStarted: status,
          }
        : room
    );
  },
};
