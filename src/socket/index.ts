import {
  createRoom,
  deleteRoom,
  getRoom,
  isActiveRoom,
  updateNumberOfUsers,
  updateRoomTimerStatus,
} from "../services/roomService";
import {
  addUserRoom,
  createUser,
  deleteUser,
  getUser,
  getUsersFromRoom,
  isActiveUser,
  removeUserRoom,
  resetUserStatus,
  updateUserStatus,
  usersStatus,
} from "../services/userService";
import { Server } from "socket.io";
import { texts } from "../data";
import { Room, User } from "../types/types";
import * as config from "../socket/config";
import { Socket } from "dgram";

let activeUsers: User[] = [];
let activeRooms: Room[] = [];

export default (io: Server) => {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;

    if (isActiveUser(activeUsers, username)) {
      socket.emit("IS_ACTIVE_USER");
    } else {
      const newUser = createUser(username, socket.id);
      activeUsers.push(newUser);
    }

    socket.emit("UPDATE_ROOMS", activeRooms);

    socket.on("disconnect", () => {
      handleRoomLeave(socket);

      activeUsers = deleteUser(activeUsers, socket.id);
    });

    socket.on("CREATE_ROOM", (roomName, callback) => {
      const isActive = isActiveRoom(activeRooms, roomName);

      if (!isActive) {
        const newRoom: Room = createRoom(roomName, 0);
        activeRooms.push(newRoom);
        socket.emit("UPDATE_ROOMS", activeRooms);
        socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
        socket.emit("UPDATE_ROOM_USERS", getUsersFromRoom(activeUsers, roomName));
      }

      callback(isActive);
    });

    socket.on("JOIN_ROOM", (roomName) => {
      activeRooms = updateNumberOfUsers(activeRooms, roomName, 1);
      activeUsers = addUserRoom(activeUsers, socket.id, roomName);
      socket.join(roomName);

      socket.emit("UPDATE_ROOM_USERS", getUsersFromRoom(activeUsers, roomName));
      socket.broadcast.emit("UPDATE_ROOM_COUNTER", getRoom(activeRooms, roomName));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
      socket.to(roomName).emit("USER_JOINED_ROOM", getUser(activeUsers, socket.id));
    });

    socket.on("LEAVE_ROOM", (roomName) => {
      handleRoomLeave(socket);
      gameStarter(socket, roomName, io);
    });

    socket.on("UPDATE_USER_STATUS", (ready, roomName) => {
      activeUsers = updateUserStatus(activeUsers, socket.id, ready);

      io.to(roomName).emit("CHANGE_USER_STATUS", {
        username: getUser(activeUsers, socket.id)?.name,
        ready: getUser(activeUsers, socket.id)?.isReady,
      });

      gameStarter(socket, roomName, io);
    });

    socket.on("GAME_OVER", (roomName) => {
      io.to(roomName).emit("SHOW_RESULT");
    });

    socket.on("RESET_USERS_IN_ROOM", (roomName) => {
      handleReset(roomName);
      io.to(roomName).emit("UPDATE_ROOM_USERS", getUsersFromRoom(activeUsers, roomName));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
    });
  });
};

const handleReset = (roomName) => {
  activeUsers = resetUserStatus(activeUsers, roomName);
  activeRooms = updateRoomTimerStatus(activeRooms, roomName, false);
};

const handleRoomLeave = (socket) => {
  const user = getUser(activeUsers, socket.id);

  if (user && user.room) {
    socket.to(user.room).emit("USER_LEFT_ROOM", getUser(activeUsers, socket.id)?.name);

    activeRooms = updateNumberOfUsers(activeRooms, user.room, -1);
    activeUsers = removeUserRoom(activeUsers, socket.id);
    socket.leave(user.room);

    if (!getRoom(activeRooms, user.room)?.timerStarted) {
      socket.emit("UPDATE_ROOM_COUNTER", getRoom(activeRooms, user.room));
      socket.emit("UPDATE_ROOMS", activeRooms);

      socket.broadcast.emit("UPDATE_ROOM_COUNTER", getRoom(activeRooms, user.room));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
    }

    handleEmptyRoom(socket, user);
  }
};

const handleEmptyRoom = (socket, user) => {
  const room = getRoom(activeRooms, user.room);

  if (room?.numberOfUsers === 0) {
    activeRooms = deleteRoom(activeRooms, room.name);

    socket.emit("EMPTY_ROOM", room.name);
    socket.emit("UPDATE_ROOMS", activeRooms);

    socket.broadcast.emit("EMPTY_ROOM", room.name);
    socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
  }
};

const gameStarter = (socket, roomName, io) => {
  if (canStartGame(roomName)) {
    activeRooms = updateRoomTimerStatus(activeRooms, roomName, true);

    socket.emit("UPDATE_ROOMS", activeRooms);
    socket.broadcast.emit("UPDATE_ROOMS", activeRooms);

    io.to(roomName).emit("START_GAME", getRandomTextId(texts));
    timer(config.SECONDS_TIMER_BEFORE_START_GAME, config.SECONDS_FOR_GAME, roomName, io);
  }
};

const timer = (timer, gameTimer, roomName, io) => {
  io.to(roomName).emit("STARTING_TIMER", timer);
  const beforeGameTimer = setInterval(function () {
    if (timer <= 0) {
      clearInterval(beforeGameTimer);
      io.to(roomName).emit("GAME_TIMER", gameTimer);
      const forGameTimer = setInterval(function () {
        if (gameTimer <= 0) {
          clearInterval(forGameTimer);
          io.to(roomName).emit("SHOW_RESULT", getUsersFromRoom(activeUsers, roomName));
        } else {
          io.to(roomName).emit("GAME_TIMER", gameTimer - 1);
          gameTimer -= 1;
        }
      }, 1000);
    } else {
      io.to(roomName).emit("STARTING_TIMER", timer - 1);
      timer -= 1;
    }
  }, 1000);
};

const canStartGame = (roomName) =>
  usersStatus(activeUsers, roomName) &&
  getUsersFromRoom(activeUsers, roomName).length >= 2 &&
  !getRoom(activeRooms, roomName)?.timerStarted
    ? true
    : false;

export const getRandomTextId = (texts) => {
  return Math.floor(Math.random() * texts.length);
};
