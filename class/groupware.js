class Groupware {
    constructor() {
        this.users = []
    }
    addUser(id, account) {
        const indexFound = this.users.findIndex(user => user.id_cuenta === account.id_cuenta);
        if (indexFound === -1) {
            this.users.push({
                ...account,
                socketIds: [id]
            });
        }
        else {
            this.users[indexFound].socketIds.push(id)
        }
    }
    getUsers() {
        return this.users;
    }
    getUser(id_cuenta) {
        return this.users.find(user => user.id_cuenta === id_cuenta);
    }
    deleteUser(id, account) {
        const indexFound = this.users.findIndex(user => user.id_cuenta === account.id_cuenta);
        if (indexFound !== -1) {
            this.users[indexFound].socketIds = this.users[indexFound].socketIds.filter(idSocket => idSocket !== id)
            if (this.users[indexFound].socketIds.length === 0) {
                this.users = this.users.filter(user => user.id_cuenta !== account.id_cuenta)
            }
        }
    }

}
module.exports = {
    Groupware
}