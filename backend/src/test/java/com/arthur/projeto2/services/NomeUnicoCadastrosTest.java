package com.arthur.projeto2.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.BairroModel;
import com.arthur.projeto2.model.TipoImovelModel;
import com.arthur.projeto2.repository.BairroRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.TipoImovelRepository;

/**
 * Regra: não pode haver dois tipos de imóvel com o mesmo nome,
 * nem dois bairros com o mesmo nome na mesma cidade.
 */
class NomeUnicoCadastrosTest {

    @Nested
    @ExtendWith(MockitoExtension.class)
    class TipoDeImovel {

        @Mock
        private TipoImovelRepository repository;

        @Mock
        private ImovelRepository imovelRepository;

        @InjectMocks
        private TipoImovelService service;

        @Test
        void recusaCadastroComNomeQueJaExiste() {
            when(repository.existeOutroComMesmoNome("Apartamento", null)).thenReturn(true);

            assertThatThrownBy(() -> service.insert(tipo(null, "Apartamento")))
                    .isInstanceOf(RegraNegocioException.class)
                    .hasMessageContaining("Já existe um tipo de imóvel chamado \"Apartamento\"");
            verify(repository, never()).save(any());
        }

        @Test
        void cadastraQuandoONomeENovo() {
            TipoImovelModel novo = tipo(null, "Casa");
            when(repository.existeOutroComMesmoNome("Casa", null)).thenReturn(false);
            when(repository.save(novo)).thenReturn(novo);

            assertThat(service.insert(novo)).isSameAs(novo);
        }

        @Test
        void recusaEdicaoParaONomeDeOutroTipo() {
            when(repository.findById(2)).thenReturn(Optional.of(tipo(2, "Casa")));
            when(repository.existeOutroComMesmoNome("Apartamento", 2)).thenReturn(true);

            // Antes o erro era engolido pelo catch do update e virava 404
            assertThatThrownBy(() -> service.update(tipo(2, "Apartamento")))
                    .isInstanceOf(RegraNegocioException.class);
            verify(repository, never()).save(any());
        }

        @Test
        void permiteSalvarOProprioTipoSemTrocarONome() {
            TipoImovelModel casa = tipo(2, "Casa");
            when(repository.findById(2)).thenReturn(Optional.of(casa));
            when(repository.existeOutroComMesmoNome("Casa", 2)).thenReturn(false);
            when(repository.save(casa)).thenReturn(casa);

            assertThat(service.update(casa)).isSameAs(casa);
        }

        private TipoImovelModel tipo(Integer id, String nome) {
            TipoImovelModel t = new TipoImovelModel();
            t.setId(id);
            t.setNome(nome);
            return t;
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class Bairro {

        @Mock
        private BairroRepository repository;

        @Mock
        private ImovelRepository imovelRepository;

        @InjectMocks
        private BairroService service;

        @Test
        void recusaBairroRepetidoNaMesmaCidade() {
            when(repository.existeOutroComMesmoNome("Centro", "Panambi", null)).thenReturn(true);

            assertThatThrownBy(() -> service.insert(bairro(null, "Centro", "Panambi")))
                    .isInstanceOf(RegraNegocioException.class)
                    .hasMessageContaining("Já existe o bairro \"Centro\" em Panambi");
            verify(repository, never()).save(any());
        }

        @Test
        void aceitaMesmoNomeEmOutraCidade() {
            BairroModel centroIjui = bairro(null, "Centro", "Ijuí");
            when(repository.existeOutroComMesmoNome("Centro", "Ijuí", null)).thenReturn(false);
            when(repository.save(centroIjui)).thenReturn(centroIjui);

            assertThat(service.insert(centroIjui)).isSameAs(centroIjui);
        }

        @Test
        void recusaEdicaoQueDuplicaOutroBairro() {
            when(repository.findById(5)).thenReturn(Optional.of(bairro(5, "Medianeira", "Panambi")));
            when(repository.existeOutroComMesmoNome("Centro", "Panambi", 5)).thenReturn(true);

            assertThatThrownBy(() -> service.update(bairro(5, "Centro", "Panambi")))
                    .isInstanceOf(RegraNegocioException.class);
            verify(repository, never()).save(any());
        }

        private BairroModel bairro(Integer id, String nome, String cidade) {
            BairroModel b = new BairroModel();
            b.setId(id);
            b.setNome(nome);
            b.setCidade(cidade);
            return b;
        }
    }
}
