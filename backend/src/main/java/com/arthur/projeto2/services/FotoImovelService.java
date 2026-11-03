package com.arthur.projeto2.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.arthur.projeto2.model.FotoImovelModel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.repository.FotoImovelRepository;
import com.arthur.projeto2.repository.ImovelRepository;

@Service
public class FotoImovelService {

    private static final Logger log = LoggerFactory.getLogger(FotoImovelService.class);

    // Só aceita imagem
    private static final List<String> EXTENSOES = List.of("jpg", "jpeg", "png", "webp");

    @Autowired
    private FotoImovelRepository fotoImovelRepository;

    @Autowired
    private ImovelRepository imovelRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public List<FotoImovelModel> getAll() {
        return fotoImovelRepository.findAll();
    }

    public List<FotoImovelModel> findByImovelId(Integer imovelId) {
        return fotoImovelRepository.findByImovelId(imovelId);
    }

    public FotoImovelModel find(Integer id) {
        return fotoImovelRepository.findById(id).orElse(null);
    }

    /**
     * Arquivos das fotos do imóvel que existem no disco, capa primeiro e depois
     * pela ordem. Fotos cujo arquivo sumiu são ignoradas (e logadas).
     */
    public List<Path> arquivosDasFotos(Integer imovelId, int limite) {
        return fotoImovelRepository.findByImovelId(imovelId).stream()
                .sorted(Comparator.comparing(FotoImovelModel::isCapa).reversed()
                        .thenComparing(FotoImovelModel::getOrdem, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(foto -> Paths.get(foto.getCaminho()))
                .filter(arquivo -> {
                    boolean existe = Files.isRegularFile(arquivo);
                    if (!existe) {
                        log.warn("Foto do imóvel {} não encontrada no disco: {}", imovelId, arquivo);
                    }
                    return existe;
                })
                .limit(limite)
                .toList();
    }

    public FotoImovelModel salvar(MultipartFile arquivo, Integer imovelId) {

        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new IllegalArgumentException("Imóvel não encontrado: " + imovelId));

        // getFilename tira as pastas do nome (ex.: "../../foto.png" vira "foto.png")
        String original = StringUtils.getFilename(StringUtils.cleanPath(arquivo.getOriginalFilename()));
        String extensao = StringUtils.getFilenameExtension(original);
        if (extensao == null || !EXTENSOES.contains(extensao.toLowerCase())) {
            throw new IllegalArgumentException("O arquivo precisa ser uma imagem (jpg, jpeg, png ou webp)");
        }

        try {
            // 1 -> criar a pasta do imóvel
            Path pasta = Paths.get(uploadDir, String.valueOf(imovelId));
            Files.createDirectories(pasta);

            // 2 -> gerar nome único
            String nomeFinal = UUID.randomUUID() + "_" + original;
            Path destino = pasta.resolve(nomeFinal);

            // 3 -> salvar o arquivo no disco
            arquivo.transferTo(destino);

            // 4 -> criar o model e salvar no banco
            FotoImovelModel model = new FotoImovelModel();
            model.setNomeArquivo(nomeFinal);
            model.setCaminho(destino.toString());
            model.setImovel(imovel);
            model.setOrdem(fotoImovelRepository.findByImovelId(imovelId).size() + 1);

            return fotoImovelRepository.save(model);

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo", e);
        }
    }

    // Edição: só a ordem, o arquivo e o imóvel não mudam
    public FotoImovelModel editar(Integer id, FotoImovelModel dados) {
        FotoImovelModel foto = find(id);
        if (foto == null) {
            return null;
        }
        foto.setOrdem(dados.getOrdem());
        return fotoImovelRepository.save(foto);
    }

    // Marca esta foto como capa e desmarca as outras do mesmo imóvel
    @Transactional
    public FotoImovelModel tornarCapa(Integer id) {
        FotoImovelModel foto = find(id);
        if (foto == null) {
            return null;
        }
        List<FotoImovelModel> fotos = fotoImovelRepository.findByImovelId(foto.getImovel().getId());
        for (FotoImovelModel f : fotos) {
            f.setCapa(f.getId().equals(id));
        }
        fotoImovelRepository.saveAll(fotos);
        return find(id);
    }

    // Apaga o registro do banco e o arquivo do disco
    public boolean excluir(Integer id) {
        FotoImovelModel foto = find(id);
        if (foto == null) {
            return false;
        }
        try {
            Files.deleteIfExists(Paths.get(foto.getCaminho()));
        } catch (IOException e) {
            System.out.println(e.toString());
        }
        fotoImovelRepository.delete(foto);
        return true;
    }
}
