export function createEconomy() {
  const prices = { ore: 3, wood: 2, meat: 5 };

  return {
    money: 0,
    backpack: { ore: 0, wood: 0, meat: 0 },
    capacity: 10,
    prices,

    total() {
      return this.backpack.ore + this.backpack.wood + this.backpack.meat;
    },

    isFull() {
      return this.total() >= this.capacity;
    },

    addItem(type) {
      if (this.isFull()) return false;
      this.backpack[type]++;
      return true;
    },

    sellAll() {
      let earned = 0;
      for (const type of Object.keys(this.backpack)) {
        earned += this.backpack[type] * prices[type];
        this.backpack[type] = 0;
      }
      this.money += earned;
      return earned;
    },
  };
}
