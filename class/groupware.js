class Groupware {
    constructor() {
        this.users = []
    }
    addUser(id, account) {
        let indexFound = this.users.findIndex(user => user.id_cuenta === account.id_cuenta);
        if (indexFound === -1) {
            let user = {
                ...account,
                socketIds: [id]
            }
            this.users.push(user);
        }
        else {
            this.users[indexFound].socketIds.push(id)
        }
    }
    getUsers() {
        return this.users;
    }
    getUser(id_cuenta) {
        let user = this.users.find(user => user.id_cuenta === id_cuenta);
        if (!user) {
            user.socketIds = []
        }
        return user.socketIds
    }
    deleteUser(id, account) {
        let indexFound = this.users.findIndex(user => user.id_cuenta === account.id_cuenta);
        this.users[indexFound].socketIds = this.users[indexFound].socketIds.filter(idSocket => idSocket !== id)
        if (this.users[indexFound].socketIds.length === 0) {
            this.users = this.users.filter(user => user.id_cuenta !== account.id_cuenta)
        }
    }

}
module.exports = {
    Groupware
}