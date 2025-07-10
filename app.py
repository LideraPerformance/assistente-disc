import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core import exceptions
from whitenoise import WhiteNoise # Importar o Whitenoise

# Carrega as variáveis de ambiente do ficheiro .env
load_dotenv()

# --- Configuração do Flask ---
app = Flask(__name__)

# --- CORREÇÃO: Configurar o Whitenoise para servir a pasta 'static' ---
# Isto garante que o CSS e o JS sejam sempre encontrados.
app.wsgi_app = WhiteNoise(app.wsgi_app, root="static/")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Verifica se a chave da API foi carregada antes de configurar
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Atenção: GEMINI_API_KEY não encontrada. As chamadas à API irão falhar.")


# --- Constante com o Prompt Base ---
PROMPT_BASE = """
Persona: Você é o 'Assistente Lidera Assessments®', um especialista virtual na metodologia DISC. Sua comunicação é sempre sugestiva e condicional (use "tende a", "pode indicar", "sugere"), nunca afirmativa. Você é um guia para o autoconhecimento.
Base de Conhecimento: D (direto, focado em resultado), I (influente, otimista), S (estável, paciente), C (cauteloso, preciso).
Sua resposta DEVE ser um objeto JSON válido, sem texto ou formatação como ```json``` antes ou depois.
"""

# --- Função Auxiliar para Chamar a API ---
def call_gemini(prompt):
    if not GEMINI_API_KEY:
        raise ValueError("A chave da API do Gemini não foi configurada no ambiente.")
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text

# --- Rota Principal: Servir a Página HTML ---
@app.route('/')
def index():
    return render_template('index.html')

# --- Rota para a Análise Inicial ---
@app.route('/analise-inicial', methods=['POST'])
def handle_initial_analysis():
    data = request.json
    scores = data.get('scores')

    prompt = f"""
    {PROMPT_BASE}
    Objetivo: Gerar uma análise DISC inicial e os pontos fortes.

    Instrução para "interacao_dos_fatores": Identifique o fator com a maior pontuação (D, I, S, ou C). Comece a sua análise com a frase "No momento, seu perfil de preferências comportamentais resulta em '[FATOR MAIS ALTO]'.". Depois, continue a explicar como os diferentes fatores interagem.

    Estrutura JSON Obrigatória:
    {{
      "analise_fator_a_fator": [{{"fator": "Dominância (D)", "cor": "var(--color-d)", "pontuacao": {scores['d']}, "analise": "..."}}],
      "interacao_dos_fatores": "No momento, seu perfil de preferências comportamentais resulta em 'X'. [Sua análise contínua aqui...]",
      "pontos_fortes": [{{"titulo": "Competitividade", "descricao": "..."}}],
      "alerta_obrigatorio": "Inclua exatamente esse parágrafo: É importante lembrar que uma análise DISC é situacional e muda ao longo do tempo. Nesta análise foi considerado como o <b>Perfil Natural</b>, ou seja, sem esforços de adaptação. Ele tende a representar variações em outros ambientes, de acordo com as circunstâncias, o contexto e as pessoas envolvidas, o que chamamos de <b>Perfil Adaptado</b>.  Para uma compreensão mais ampla e aprofundada, recomenda-se uma avaliação DISC completa com dois questionários e a inclusão de outras avaliação no processo de autoconhecimento e autoconsciência para o desenvolvimento, bem como, para a eficiência de processos de recrutamento e seleção."
    }}
    Analise o perfil com as pontuações: D={scores['d']}, I={scores['i']}, S={scores['s']}, C={scores['c']}.
    """
    try:
        api_response = call_gemini(prompt)
        return api_response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Rota para Pontos de Melhoria ---
@app.route('/pontos-melhoria', methods=['POST'])
def handle_improvement_points():
    data = request.json
    context = data.get('context')

    prompt = f"""
    {PROMPT_BASE}
    Objetivo: Sugerir pontos de melhoria com base na análise DISC fornecida.
    Estrutura JSON Obrigatória:
    {{
      "aviso_obrigatorio": "Estas sugestões são pontos de partida para o desenvolvimento pessoal, baseadas em tendências gerais do perfil.",
      "pontos_fortes": [{{"ponto": "Nome do Ponto Forte", "desafio_potencial": "...", "sugestao": "..."}}],
      "pontos_a_desenvolver": [{{"ponto": "Nome do Ponto a Desenvolver", "desafio_potencial": "...", "sugestao": "..."}}]
    }}
    Análise de Contexto: {context}
    """
    try:
        api_response = call_gemini(prompt)
        return api_response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Rota para Sugestões de Profissões ---
@app.route('/sugestao-profissoes', methods=['POST'])
def handle_career_suggestions():
    data = request.json
    context = data.get('context')

    prompt = f"""
    {PROMPT_BASE}
    Objetivo: Sugerir profissões com base na análise DISC fornecida.
    Estrutura JSON Obrigatória:
    {{
      "aviso_obrigatorio": "Estas sugestões de carreira são baseadas unicamente em tendências comportamentais. A escolha de carreira envolve muitos outros fatores.",
      "profissoes_sugeridas": [{{"area": "Nome da Área", "justificativa": "...", "exemplos": "Cargo 1, Cargo 2"}}]
    }}
    Análise de Contexto: {context}
    """
    try:
        api_response = call_gemini(prompt)
        return api_response
    except exceptions.ResourceExhausted as e:
        print(f"Erro de limite de requisições (429) da API Gemini: {e}")
        mensagem_amigavel = "Você atingiu o limite de análises por um período. Por favor, aguarde um momento antes de tentar novamente."
        return jsonify({"error": mensagem_amigavel}), 429
    except exceptions.ServiceUnavailable as e:
        print(f"Erro de serviço (503) da API Gemini: {e}")
        mensagem_amigavel = "Nosso assistente de IA está com alta demanda no momento. Por favor, tente novamente em alguns instantes."
        return jsonify({"error": mensagem_amigavel}), 503
    except ValueError as e:
        print(f"Erro de valor (JSON inválido): {e}")
        mensagem_amigavel = "Houve um problema ao processar a resposta da análise. Nossa equipe já foi notificada."
        return jsonify({"error": mensagem_amigavel}), 500
    except Exception as e:
        print(f"Erro inesperado: {e}")
        mensagem_amigavel = "Um imprevisto impediu a geração da sua análise. Por favor, tente novamente mais tarde."
        return jsonify({"error": mensagem_amigavel}), 500
