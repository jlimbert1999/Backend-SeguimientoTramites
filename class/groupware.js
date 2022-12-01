class Groupware {
    constructor() {
        this.funcionarios = []
    }
    add_funcionario(id, id_cuenta, funcionario, cargo) {
        const found = this.funcionarios.some(user => user.id_cuenta === id_cuenta);
        if (!found) {
            let persona = {
                id,
                id_cuenta,
                funcionario,
                cargo
            }
            this.funcionarios.push(persona);
        }
    }
    get_funcionarios() {
        return this.funcionarios;
    }
    get_funcionario(id) {
        let persona = this.funcionarios.filter(perso => {
            return perso.id === id
        })[0]
        return persona
    }
    delete_funcionario(id) {
        let personaBorrada = this.get_funcionario(id);
        this.funcionarios = this.funcionarios.filter(perso => perso.id != id);
        return personaBorrada
    }

}
module.exports = {
    Groupware
}