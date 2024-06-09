from flask import Flask, render_template, request, redirect, url_for, jsonify
import requests
import os

app = Flask(__name__, static_folder='fundo', static_url_path='/static')


# Definindo as variáveis de ambiente
API_BASE_URL = os.getenv("API_BASE_URL" , "http://localhost:5000/api/v1/time")
API_DATABASE_RESET = os.getenv("API_DATABASE_RESET" , "http://localhost:5000/api/v1/database/reset") 

# Rota para a página inicial
@app.route('/')
def index():
    return render_template('index.html')

# Rota para exibir o formulário de cadastro
@app.route('/inserir', methods=['GET'])
def inserir_time_form():
    return render_template('inserir.html')

# Rota para enviar os dados do formulário de cadastro para a API
@app.route('/inserir', methods=['POST'])
def inserir_time():
    nome = request.form['nome']
    jogador1 = request.form['jogador1']
    jogador2 = request.form['jogador2']
    jogador3 = request.form['jogador3']
    jogador4 = request.form['jogador4']
    jogador5 = request.form['jogador5']

    payload = {
        'nome': nome,
        'jogador1': jogador1,
        'jogador2': jogador2,
        'jogador3': jogador3,
        'jogador4': jogador4,
        'jogador5': jogador5
    }

    response = requests.post(f'{API_BASE_URL}/inserir', json=payload)
    
    if response.status_code == 201:
        return redirect(url_for('listar_times'))
    else:
        return "Erro ao inserir um time", 500

# Rota para listar todos os times
@app.route('/listar', methods=['GET'])
def listar_times():
    response = requests.get(f'{API_BASE_URL}/listar')
    times = response.json()
    return render_template('listar.html', times=times)

# Rota para exibir o formulário de edição de um time
@app.route('/atualizar/<int:time_id>', methods=['GET'])
def atualizar_time_form(time_id):
    response = requests.get(f"{API_BASE_URL}/listar")
    #filtrando apenas o time correspondente ao ID
    times = [time for time in response.json() if time['id'] == time_id]
    if len(times) == 0:
        return "Time não encontrado", 404
    time = times[0]
    return render_template('atualizar.html', time=time)

# Rota para enviar os dados do formulário de edição de um time para a API
@app.route('/atualizar/<int:time_id>', methods=['POST'])
def atualizar_time(time_id):
    nome = request.form['nome']
    jogador1 = request.form['jogador1']
    jogador2 = request.form['jogador2']
    jogador3 = request.form['jogador3']
    jogador4 = request.form['jogador4']
    jogador5 = request.form['jogador5']

    payload = {
        'id': time_id,
        'nome': nome,
        'jogador1': jogador1,
        'jogador2': jogador2,
        'jogador3': jogador3,
        'jogador4': jogador4,
        'jogador5': jogador5
    }

    response = requests.post(f"{API_BASE_URL}/atualizar", json=payload)
    
    if response.status_code == 200:
        return redirect(url_for('listar_times'))
    else:
        return "Erro ao atualizar o time", 500

# Rota para excluir um time
@app.route('/excluir/<int:time_id>', methods=['POST'])
def excluir_time(time_id):
    #payload = {'id': time_id}
    payload = {'id': time_id}

    response = requests.post(f"{API_BASE_URL}/excluir", json=payload)
    
    if response.status_code == 200  :
        return redirect(url_for('listar_times'))
    else:
        return "Erro ao excluir o time", 500

#Rota para resetar o database
@app.route('/reset-database', methods=['GET'])
def resetar_database():
    response = requests.delete(API_DATABASE_RESET)
    
    if response.status_code == 200  :
        return redirect(url_for('index'))
    else:
        return "Erro ao resetar o database", 500

# Nova rota para exibir as partidas sorteadas
@app.route('/partida', methods=['GET'])
def gerar_partidas():
    response = requests.post(f'{API_BASE_URL}/partida')
    matches = response.json()
    return render_template('partida.html', matches=matches['matches'])


if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')
