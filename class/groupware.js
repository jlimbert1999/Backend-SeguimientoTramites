class Groupware {
    constructor() {
        this.accounts = []
    }
    addUser(id, account) {
        const indexFound = this.accounts.findIndex(acc => acc.id_account === account.id_account);
        if (indexFound === -1) {
            this.accounts.push({
                ...account,
                socketIds: [id]
            });
        }
        else {
            this.accounts[indexFound].socketIds.push(id)
        }
    }
    getUsers() {
        return this.accounts;
    }
    getUser(id_account) {
        return this.accounts.find(acc => acc.id_account === id_account);
    }
    deleteUser(id, id_account) {
        const indexFound = this.accounts.findIndex(acc => acc.id_account === id_account);
        if (indexFound !== -1) {
            this.accounts[indexFound].socketIds = this.accounts[indexFound].socketIds.filter(idSocket => idSocket !== id)
            if (this.accounts[indexFound].socketIds.length === 0) {
                this.accounts = this.accounts.filter(acc => acc.id_account !== id_account)
            }
        }
    }

}
module.exports = {
    Groupware
}