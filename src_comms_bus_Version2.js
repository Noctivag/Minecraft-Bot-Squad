const { EventEmitter } = require("events");

class Bus extends EventEmitter {
  publish(topic, payload) {
    this.emit(topic, payload);
  }
  subscribe(topic, handler) {
    this.on(topic, handler);
    return () => this.off(topic, handler);
  }
}

const bus = new Bus();

const Topics = {
  WORLD_EVENT: "world.event",
  BOT_STATUS: "bot.status",
  PLAN_PROPOSED: "plan.proposed",
  PLAN_FEEDBACK: "plan.feedback",
  CHAT_PUBLIC: "chat.public",
  CHAT_TEAM: "chat.team",
};

module.exports = { bus, Topics };