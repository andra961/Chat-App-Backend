export type MessageBase = {
  senderId: string;
  text: string;
  timestamp: number;
};

export type GroupMessage = MessageBase & {
  chatId: string;
};

export type DirectMessage = MessageBase & {
  receiver: string;
};
