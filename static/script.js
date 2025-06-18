
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const sliders = {
        d: document.getElementById('d-slider'),
        i: document.getElementById('i-slider'),
        s: document.getElementById('s-slider'),
        c: document.getElementById('c-slider')
    };
    
    const values = {
        d: document.getElementById('d-value'),
        i: document.getElementById('i-value'),
        s: document.getElementById('s-value'),
        c: document.getElementById('c-value')
    };
    
    const form = document.getElementById('disc-form');
    const resultsSection = document.getElementById('results-section');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const outputDiv = document.getElementById('analysis-output');
    
    // Atualizar valores dos sliders
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', function() {
            values[key].textContent = parseFloat(this.value).toFixed(1);
        });
    });
    
    // Submissão do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            d: parseFloat(sliders.d.value),
            i: parseFloat(sliders.i.value),
            s: parseFloat(sliders.s.value),
            c: parseFloat(sliders.c.value)
        };
        
        // Mostrar loading
        resultsSection.classList.remove('hidden');
        loading.classList.remove('hidden');
        loading.classList.add('flex');
        errorMessage.classList.add('hidden');
        outputDiv.innerHTML = '';
        
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao processar análise');
            }
            
            const result = await response.json();
            displayResults(result);
            
        } catch (error) {
            errorMessage.textContent = 'Erro ao gerar análise. Tente novamente.';
            errorMessage.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
            loading.classList.remove('flex');
        }
    });
    
    function displayResults(data) {
        // HTML para análise fator a fator
        const fatorHtml = `
            <div class="card">
                <h2 class="text-2xl font-bold mb-6 text-slate-700 text-center">📊 Análise Fator a Fator</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
                        <h3 class="font-bold text-red-700 mb-2">🎯 Dominância (D): ${data.scores.d}</h3>
                        <p class="text-sm text-red-600">${data.analysis.d}</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
                        <h3 class="font-bold text-yellow-700 mb-2">⭐ Influência (I): ${data.scores.i}</h3>
                        <p class="text-sm text-yellow-600">${data.analysis.i}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                        <h3 class="font-bold text-green-700 mb-2">🤝 Estabilidade (S): ${data.scores.s}</h3>
                        <p class="text-sm text-green-600">${data.analysis.s}</p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                        <h3 class="font-bold text-blue-700 mb-2">📋 Conformidade (C): ${data.scores.c}</h3>
                        <p class="text-sm text-blue-600">${data.analysis.c}</p>
                    </div>
                </div>
            </div>
        `;
        
        // HTML para interação entre fatores
        const interacaoHtml = `
            <div class="card">
                <h2 class="text-2xl font-bold mb-6 text-slate-700 text-center">🔄 Interação Entre Fatores</h2>
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl">
                    <p class="text-slate-700 leading-relaxed">${data.factor_interaction}</p>
                </div>
            </div>
        `;
        
        // HTML para pontos fortes
        const pontosFortesHtml = `
            <div class="card">
                <h2 class="text-2xl font-bold mb-6 text-slate-700 text-center">💪 Pontos Fortes Identificados</h2>
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl">
                    <ul class="space-y-3">
                        ${data.strengths.map(strength => `<li class="flex items-start gap-3"><span class="text-emerald-600 font-bold">✓</span><span class="text-slate-700">${strength}</span></li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        // HTML para alertas
        const alertaHtml = `
            <div class="card">
                <h2 class="text-2xl font-bold mb-6 text-slate-700 text-center">⚠️ Pontos de Atenção</h2>
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
                    <ul class="space-y-3">
                        ${data.alerts.map(alert => `<li class="flex items-start gap-3"><span class="text-amber-600 font-bold">!</span><span class="text-slate-700">${alert}</span></li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        // HTML para seção interativa
        const interactiveSectionHTML = `
            <div class="card">
                <h2 class="text-2xl font-bold mb-6 text-slate-700 text-center">🎯 Análises Especializadas</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button id="pontos-melhoria-btn" class="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl">
                        🎯 Pontos de Melhoria
                    </button>
                    <button id="sugestoes-profissoes-btn" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl">
                        💼 Sugestões de Profissões
                    </button>
                </div>
                <div id="pontos-melhoria-container" class="hidden mt-6"></div>
                <div id="sugestoes-profissoes-container" class="hidden mt-6"></div>
            </div>
        `;
        
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
    }
    
    function addInteractiveListeners() {
        document.getElementById('pontos-melhoria-btn').addEventListener('click', async function() {
            await loadInteractiveAnalysis('improvement_points', 'pontos-melhoria-container');
        });
        
        document.getElementById('sugestoes-profissoes-btn').addEventListener('click', async function() {
            await loadInteractiveAnalysis('career_suggestions', 'sugestoes-profissoes-container');
        });
    }
    
    async function loadInteractiveAnalysis(type, containerId) {
        const container = document.getElementById(containerId);
        const data = {
            d: parseFloat(sliders.d.value),
            i: parseFloat(sliders.i.value),
            s: parseFloat(sliders.s.value),
            c: parseFloat(sliders.c.value),
            analysis_type: type
        };
        
        container.innerHTML = '<div class="flex items-center justify-center p-8"><div class="spinner"></div><span class="ml-3 text-slate-600">Carregando...</span></div>';
        container.classList.remove('hidden');
        
        try {
            const response = await fetch('/interactive_analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao processar análise');
            }
            
            const result = await response.json();
            
            let html = '';
            if (type === 'improvement_points') {
                html = `
                    <div class="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                        <h3 class="text-xl font-bold text-orange-700 mb-4">🎯 Pontos de Melhoria</h3>
                        <ul class="space-y-3">
                            ${result.analysis.map(point => `<li class="flex items-start gap-3"><span class="text-orange-600 font-bold">→</span><span class="text-slate-700">${point}</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                html = `
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                        <h3 class="text-xl font-bold text-purple-700 mb-4">💼 Sugestões de Profissões</h3>
                        <ul class="space-y-3">
                            ${result.analysis.map(profession => `<li class="flex items-start gap-3"><span class="text-purple-600 font-bold">•</span><span class="text-slate-700">${profession}</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            container.innerHTML = html;
            container.classList.remove('hidden');
            
            // Scroll automático para o container da análise interativa
            setTimeout(() => {
                container.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
            
        } catch (error) {
            container.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">Erro ao carregar análise. Tente novamente.</div>';
        }
    }
});
