package com.arthur.projeto2.services;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusContrato;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.repository.ContratoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;

/** Números do painel do admin. */
@Service
public class DashboardService {

    private final ImovelRepository imovelRepository;
    private final OfertaRepository ofertaRepository;
    private final ContratoRepository contratoRepository;

    public DashboardService(ImovelRepository imovelRepository, OfertaRepository ofertaRepository,
            ContratoRepository contratoRepository) {
        this.imovelRepository = imovelRepository;
        this.ofertaRepository = ofertaRepository;
        this.contratoRepository = contratoRepository;
    }

    public Map<String, Object> resumo() {
        List<ImovelModel> imoveis = imovelRepository.findAll();
        List<OfertaModel> ofertas = ofertaRepository.findAll();

        Map<String, Long> porBairro = new TreeMap<>();
        for (ImovelModel i : imoveis) {
            String bairro = i.getBairro() != null ? i.getBairro().getNome() : "Sem bairro";
            porBairro.merge(bairro, 1L, Long::sum);
        }

        Map<String, Long> porSituacao = new LinkedHashMap<>();
        Arrays.stream(StatusOferta.values()).forEach(s -> porSituacao.put(s.name(), 0L));
        ofertas.forEach(o -> porSituacao.merge(o.getStatus().name(), 1L, Long::sum));

        Map<String, Long> porFinalidade = new LinkedHashMap<>();
        Arrays.stream(FinalidadeImovel.values()).forEach(f -> porFinalidade.put(f.name(), 0L));
        imoveis.forEach(i -> porFinalidade.merge(i.getFinalidade().name(), 1L, Long::sum));

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("imoveisDisponiveis", imovelRepository.countByStatus(StatusImovel.DISPONIVEL));
        r.put("ofertasPendentes", ofertaRepository.countByStatus(StatusOferta.PENDENTE));
        r.put("contratosAguardandoAssinatura", contratoRepository.countByStatus(StatusContrato.AGUARDANDO_ASSINATURA));
        r.put("totalImoveis", imoveis.size());
        r.put("imoveisPorBairro", porBairro);
        r.put("ofertasPorSituacao", porSituacao);
        r.put("imoveisPorFinalidade", porFinalidade);
        return r;
    }
}
