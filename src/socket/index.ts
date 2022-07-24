import { RoomService } from "../services/roomService";
import { UserService } from "../services/userService";
import { Server } from "socket.io";
import { texts } from "../data";
import { Room, User, UserProgress } from "../types";
import * as config from "../socket/config";
import { getRandomTextId } from "../helpers";

let activeUsers: User[] = [];
let activeRooms: Room[] = [];

export default (io: Server) => {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;

    if (UserService.isActiveUser(activeUsers, username)) {
      socket.emit("IS_ACTIVE_USER");
    } else {
      const newUser = UserService.createUser(username, socket.id);
      activeUsers.push(newUser);
    }

    socket.emit("UPDATE_ROOMS", activeRooms);

    socket.on("disconnect", () => {
      handleRoomLeave(socket);

      activeUsers = UserService.deleteUser(activeUsers, socket.id);
    });

    socket.on("CREATE_ROOM", (roomName, callback) => {
      const isActive = RoomService.isActiveRoom(activeRooms, roomName);

      if (!isActive) {
        const newRoom: Room = RoomService.createRoom(roomName, 0);
        activeRooms.push(newRoom);
        socket.emit("UPDATE_ROOMS", activeRooms);
        socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
        socket.emit("UPDATE_ROOM_USERS", UserService.getUsersFromRoom(activeUsers, roomName));
      }

      callback(isActive);
    });

    socket.on("JOIN_ROOM", (roomName) => {
      activeRooms = RoomService.updateNumberOfUsers(activeRooms, roomName, 1);
      activeUsers = UserService.addUserRoom(activeUsers, socket.id, roomName);
      socket.join(roomName);

      socket.emit("UPDATE_ROOM_USERS", UserService.getUsersFromRoom(activeUsers, roomName));
      socket.broadcast.emit("UPDATE_ROOM_COUNTER", RoomService.getRoom(activeRooms, roomName));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
      socket.to(roomName).emit("USER_JOINED_ROOM", UserService.getUser(activeUsers, socket.id));
    });

    socket.on("LEAVE_ROOM", (roomName) => {
      handleRoomLeave(socket);
      gameStarter(socket, roomName, io);
    });

    socket.on("UPDATE_USER_STATUS", (ready, roomName) => {
      activeUsers = UserService.updateUserStatus(activeUsers, socket.id, ready);

      io.to(roomName).emit("CHANGE_USER_STATUS", {
        username: UserService.getUser(activeUsers, socket.id)?.name,
        ready: UserService.getUser(activeUsers, socket.id)?.isReady,
      });

      gameStarter(socket, roomName, io);
    });

    socket.on("UPDATE_PROGRESS", (userProgress, roomName) => {
      activeUsers = UserService.updateUserProgress(activeUsers, socket.id, userProgress as UserProgress);

      io.to(roomName).emit("UPDATE_PROGRESS_BARS", UserService.getUsersFromRoom(activeUsers, roomName));
    });

    socket.on("RESET_USERS_IN_ROOM", (roomName) => {
      handleReset(roomName);
      io.to(roomName).emit("UPDATE_ROOM_USERS", UserService.getUsersFromRoom(activeUsers, roomName));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
    });
  });
};

const handleReset = (roomName) => {
  activeUsers = UserService.resetUserStatus(activeUsers, roomName);
  activeRooms = RoomService.updateRoomTimerStatus(activeRooms, roomName, false);
};

const handleRoomLeave = (socket) => {
  const user = UserService.getUser(activeUsers, socket.id);

  if (user && user.room) {
    socket.to(user.room).emit("USER_LEFT_ROOM", UserService.getUser(activeUsers, socket.id)?.name);

    activeRooms = RoomService.updateNumberOfUsers(activeRooms, user.room, -1);
    activeUsers = UserService.removeUserRoom(activeUsers, socket.id);
    socket.leave(user.room);

    if (!RoomService.getRoom(activeRooms, user.room)?.timerStarted) {
      socket.emit("UPDATE_ROOM_COUNTER", RoomService.getRoom(activeRooms, user.room));
      socket.emit("UPDATE_ROOMS", activeRooms);

      socket.broadcast.emit("UPDATE_ROOM_COUNTER", RoomService.getRoom(activeRooms, user.room));
      socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
    }

    handleEmptyRoom(socket, user);
  }
};

const handleEmptyRoom = (socket, user) => {
  const room = RoomService.getRoom(activeRooms, user.room);

  if (room?.numberOfUsers === 0) {
    activeRooms = RoomService.deleteRoom(activeRooms, room.name);

    socket.emit("EMPTY_ROOM", room.name);
    socket.emit("UPDATE_ROOMS", activeRooms);

    socket.broadcast.emit("EMPTY_ROOM", room.name);
    socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
  }
};

const gameStarter = (socket, roomName, io) => {
  if (canStartGame(roomName)) {
    activeRooms = RoomService.updateRoomTimerStatus(activeRooms, roomName, true);

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
      io.to(roomName).emit("GAME_SETTINGS");
      io.to(roomName).emit("GAME_TIMER", gameTimer);
      const forGameTimer = setInterval(function () {
        if (gameTimer <= 0 || isGameEnd(roomName)) {
          clearInterval(forGameTimer);
          io.to(roomName).emit("SHOW_RESULT", UserService.getUsersFromRoom(activeUsers, roomName));
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

const isGameEnd = (roomName) => {
  const users = UserService.getUsersFromRoom(activeUsers, roomName);

  return users.every((user) => user.progress === 100);
};

const canStartGame = (roomName) =>
  UserService.usersStatus(activeUsers, roomName) &&
  UserService.getUsersFromRoom(activeUsers, roomName).length >= 2 &&
  !RoomService.getRoom(activeRooms, roomName)?.timerStarted
    ? true
    : false;
