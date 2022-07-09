import { Room } from "../types/types";

export const createRoom = (roomName: string, count: number): Room => {
  return {
    name: roomName,
    userCount: count,
  };
};

export const deleteRoom = (activeRooms: Room[], roomName): Room[] => {
  return activeRooms.filter((room) => {
    return room != roomName;
  });
};

export const isActiveRoom = (activeRooms: Room[], roomName: string): Room | undefined => {
  return activeRooms.find((room) => room.name == roomName);
};
