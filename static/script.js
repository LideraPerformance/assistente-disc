document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const form = document.getElementById('disc-form');
    const sliders = { D: document.getElementById('d-slider'), I: document.getElementById('i-slider'), S: document.getElementById('s-slider'), C: document.getElementById('c-slider') };
    const values = { D: document.getElementById('d-value'), I: document.getElementById('i-value'), S: document.getElementById('s-value'), C: document.getElementById('c-value') };
    const resultsSection = document.getElementById('results-section');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const outputDiv = document.getElementById('analysis-output');
    const submitButton = document.getElementById('submit-button');
    let initialAnalysisContext = null;

    // --- Lógica de UI ---
    for (const key in sliders) {
        sliders[key].addEventListener('input', (event) => {
            values[key].textContent = parseFloat(event.target.value).toFixed(1);
        });
    }

    const resetUI = () => {
        resultsSection.classList.remove('hidden');
        loadingDiv.classList.remove('hidden');
        loadingDiv.classList.add('flex');
        errorDiv.classList.add('hidden');
        outputDiv.innerHTML = '';
        const interactiveSection = document.getElementById('interactive-section');
        if(interactiveSection) interactiveSection.remove();
        submitButton.disabled = true;
        submitButton.textContent = 'Analisando...';
    };

    const finalizeUI = () => {
        loadingDiv.classList.add('hidden');
        loadingDiv.classList.remove('flex');
        submitButton.disabled = false;
        submitButton.textContent = 'Gerar Análise';
    }

    // --- Lógica de Chamada ao Backend ---
    async function fetchAnalysis(endpoint, body) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Ocorreu um erro desconhecido no servidor.");
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
            throw error;
        }
    }
    
    // --- Manipulador do Formulário Principal ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetUI();

        const scores = {
            d: sliders.D.value, i: sliders.I.value,
            s: sliders.S.value, c: sliders.C.value,
        };

        try {
            const data = await fetchAnalysis('/analise-inicial', { scores });
            initialAnalysisContext = data;
            displayInitialAnalysis(data);
        } catch (error) {
            // O erro já foi tratado
        } finally {
            finalizeUI();
        }
    });
    
    // --- Funções de Renderização ---
    function displayInitialAnalysis(data) {
        let fatorHtml = `<div class="card"><h3 class="text-xl md:text-2xl font-bold mb-6 text-center text-slate-700">Análise Fator a Fator</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-6">`;
        data.analise_fator_a_fator.forEach(item => {
            fatorHtml += `<div class="bg-gray-50 p-4 rounded-xl border"><div class="flex items-center justify-between mb-2"><p class="font-bold text-lg" style="color: ${item.cor};">${item.fator}</p><p class="font-semibold text-sm text-white py-1 px-2.5 rounded-md" style="background-color: ${item.cor};">${item.pontuacao}</p></div><p class="text-slate-600 text-sm">${item.analise}</p></div>`;
        });
        fatorHtml += `</div></div>`;

        const interacaoHtml = `<div class="card"><h3 class="text-xl md:text-2xl font-bold mb-4 text-slate-700">Interação dos Fatores</h3><p class="text-slate-600 leading-relaxed">${data.interacao_dos_fatores}</p></div>`;
        const pontosFortesHtml = `<div class="card"><h3 class="text-xl md:text-2xl font-bold mb-4 text-slate-700">Pontos Fortes</h3><div class="space-y-4">${data.pontos_fortes.map(p => `<div class="p-4 bg-gray-50 rounded-lg border border-gray-200"><strong class="text-slate-800">${p.titulo}</strong><p class="text-sm text-slate-600 mt-1">${p.descricao}</p></div>`).join('')}</div></div>`;
        const alertaHtml = `<div class="bg-blue-100 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm" role="alert"><p class="font-bold">Aviso Importante</p><p>${data.alerta_obrigatorio}</p></div>`;
        
        const interactiveSectionHTML = `
            <div id="interactive-section" class="space-y-6">
                <div class="card">
                    <h3 class="text-xl md:text-2xl font-bold mb-6 text-center text-slate-700">Explore Mais</h3>
                    <div class="flex flex-col md:flex-row gap-4 justify-center">
                        <button data-action="melhoria" class="interactive-button bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            Pontos de Atenção
                        </button>
                        <button data-action="profissoes" class="interactive-button bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Sugestões de Profissões
                        </button>
                    </div>
                </div>
                <div id="interactive-loading" class="hidden flex-col items-center justify-center p-4"><div class="spinner spinner-small"></div></div>
                <div id="interactive-output-melhoria" class="hidden card"></div>
                <div id="interactive-output-profissoes" class="hidden card"></div>
            </div>`;

        outputDiv.innerHTML = fatorHtml + interacaoHtml + pontosFortesHtml + alertaHtml;
        resultsSection.insertAdjacentHTML('beforeend', interactiveSectionHTML);
        addInteractiveListeners();
        
        // Scroll automático para a seção de resultados
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
        document.getElementById('cta-adicional').classList.remove('hidden');
    }
    
    function addInteractiveListeners() {
        document.querySelectorAll('.interactive-button').forEach(button => {
            button.addEventListener('click', async () => {
                const action = button.dataset.action;
                const endpoint = action === 'melhoria' ? '/pontos-melhoria' : '/sugestao-profissoes';
                const outputContainer = document.getElementById(`interactive-output-${action}`);
                
                document.getElementById('interactive-output-melhoria').classList.add('hidden');
                document.getElementById('interactive-output-profissoes').classList.add('hidden');
                const interactiveLoading = document.getElementById('interactive-loading');
                interactiveLoading.classList.remove('hidden');
                interactiveLoading.classList.add('flex');

                try {
                    const data = await fetchAnalysis(endpoint, { context: initialAnalysisContext });
                    displayInteractiveAnalysis(action, data, outputContainer);
                } catch (error) {
                    console.error("Erro ao buscar análise:", error);
                } finally {
                    interactiveLoading.classList.add('hidden');
                    interactiveLoading.classList.remove('flex');
                }
            });
        });
    }

    function displayInteractiveAnalysis(action, data, container) {
        let html = '';
        if (action === 'melhoria') {
            html = `<h4 class="text-xl font-bold mb-4 text-slate-700">Pontos de Atenção</h4>`;
             if(data.aviso_obrigatorio) {
                html += `<div class="mb-6 bg-gray-100 p-4 rounded-lg" role="alert"><p class="font-bold text-slate-700">Atenção!</p><p class="text-sm text-slate-600 mt-1">${data.aviso_obrigatorio}</p></div>`;
            }
            html += `<h5 class="font-semibold mt-4 mb-2 text-green-700">Potencializando Pontos Fortes</h5><div class="space-y-4">`;
            data.pontos_fortes.forEach(p => {
                html += `<div class="p-4 bg-green-50 rounded-lg border border-green-200"><strong>${p.ponto}:</strong><p class="text-sm text-slate-600 mt-1"><strong>Desafio:</strong> ${p.desafio_potencial}</p><p class="text-sm text-slate-600 mt-1"><strong>Sugestão:</strong> ${p.sugestao}</p></div>`;
            });
            html += `</div><h5 class="font-semibold mt-6 mb-2 text-amber-700">Potencias Oportunidades de Melhoria</h5><div class="space-y-4">`;
            data.pontos_a_desenvolver.forEach(p => {
                html += `<div class="p-4 bg-amber-50 rounded-lg border border-amber-200"><strong>${p.ponto}:</strong><p class="text-sm text-slate-600 mt-1"><strong>Desafio:</strong> ${p.desafio_potencial}</p><p class="text-sm text-slate-600 mt-1"><strong>Sugestão:</strong> ${p.sugestao}</p></div>`;
            });
            html += `</div>`;
        } else if (action === 'profissoes') {
            html = `<h4 class="text-xl font-bold mb-4 text-slate-700">Sugestões de Profissões</h4>`;
             if(data.aviso_obrigatorio) {
                html += `<div class="mb-6 bg-gray-100 p-4 rounded-lg" role="alert"><p class="font-bold text-slate-700">Atenção!</p><p class="text-sm text-slate-600 mt-1">${data.aviso_obrigatorio}</p></div>`;
            }
            html += `<div class="space-y-4">`;
            data.profissoes_sugeridas.forEach(p => {
                html += `<div class="p-4 bg-purple-50 rounded-lg border border-purple-200"><strong>Área: ${p.area}</strong><p class="text-sm mt-1 text-slate-600">${p.justificativa}</p><p class="text-sm mt-2 font-semibold text-slate-700">Exemplos: <span class="font-normal">${p.exemplos}</span></p></div>`;
            });
            html += `</div>`;
        }
        container.innerHTML = html;
        container.classList.remove('hidden');
    }
});
