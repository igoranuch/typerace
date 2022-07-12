import { MAXIMUM_USERS_FOR_ONE_ROOM } from "../socket/config";
import { Room } from "../types/types";

export const createRoom = (roomName: string, count: number): Room => {
  return {
    name: roomName,
    numberOfUsers: count,
    isFull: false,
    timerStarted: false,
  };
};

export const deleteRoom = (activeRooms: Room[], roomName): Room[] => {
  return activeRooms.filter((room) => {
    return room.name != roomName;
  });
};

export const isActiveRoom = (activeRooms: Room[], roomName: string): Room | undefined => {
  return activeRooms.find((room) => room.name == roomName);
};

export const updateNumberOfUsers = (activeRooms: Room[], roomName: string, diff: number): Room[] => {
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
};

export const getRoom = (activeRooms: Room[], roomName: string): Room | undefined => {
  return activeRooms.find((room) => {
    return room.name === roomName;
  });
};

export const updateRoomTimerStatus = (activeRooms: Room[], roomName: string, status: boolean): Room[] => {
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
};
