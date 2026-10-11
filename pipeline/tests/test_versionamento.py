import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import preparar_versionamento as pv  # noqa: E402

MB = 1024 * 1024


def repo_falso(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    return tmp_path


def escrever(caminho, conteudo=b"", tamanho=None):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "wb") as f:
        f.write(conteudo if isinstance(conteudo, bytes) else conteudo.encode("utf-8"))
        if tamanho:
            f.truncate(tamanho)
    return caminho


def test_filtrar_inep_latin1_ponto_e_virgula(tmp_path):
    origem = tmp_path / "microdados_ed_basica_2025.csv"
    linhas = ["CO_MUNICIPIO;NO_ENTIDADE;IN_COMUM_CRECHE",
              "3543907;E.M. Ângela Mônaco;1",
              "3550308;Escola de São Paulo;1",
              "3543907;E.M. Dom Pedro I;0",
              "3304003;Outra cidade;0"]
    origem.write_bytes("\n".join(linhas).encode("latin-1"))
    destino = tmp_path / "recorte.csv"
    total, mantidas = pv.filtrar_inep(origem, destino)
    assert (total, mantidas) == (4, 2)
    texto = destino.read_bytes().decode("latin-1")
    assert "Ângela Mônaco" in texto and "São Paulo" not in texto and "Outra cidade" not in texto
    assert texto.splitlines()[0] == "CO_MUNICIPIO;NO_ENTIDADE;IN_COMUM_CRECHE"


def test_filtrar_inep_utf8_com_bom_e_aspas(tmp_path):
    origem = tmp_path / "m.csv"
    origem.write_bytes("﻿\"CO_MUNICIPIO\",\"NO_ENTIDADE\"\n\"3543907\",\"Escola Ação\"\n\"3550308\",\"Escola X\"\n".encode("utf-8"))
    destino = tmp_path / "r.csv"
    assert pv.filtrar_inep(origem, destino) == (2, 1)
    assert "Escola Ação" in destino.read_text(encoding="utf-8-sig")


def test_filtrar_inep_sem_coluna_do_municipio(tmp_path):
    origem = tmp_path / "m.csv"
    origem.write_text("A;B\n1;2\n", encoding="utf-8")
    try:
        pv.filtrar_inep(origem, tmp_path / "r.csv")
        assert False, "deveria falhar"
    except SystemExit as e:
        assert "CO_MUNICIPIO" in str(e)


def test_classificar_limites_e_motivos():
    p = Path("x.json")
    assert pv.classificar(p, 100 * MB, 10, 0)[0] == "BLOQUEADO"
    assert pv.classificar(Path("microdados_ed_basica_2025.csv"), 300 * MB, 10, 0)[0] == "BLOQUEADO"  # tamanho vence
    assert pv.classificar(Path("microdados_ed_basica_2025.csv"), 60 * MB, 10, 0)[0] == "FILTRAR"
    assert pv.classificar(p, 1 * MB, 10, 3)[0] == "REVISAR"          # CPF
    assert pv.classificar(p, 5 * MB, 120_000, 0)[0] == "REVISAR"     # dado bruto
    assert pv.classificar(p, 60 * MB, 10, 0)[0] == "AVISO"
    assert pv.classificar(p, 80 * 1024, 10, 0)[0] == "PODE"
    assert pv.classificar(Path("a.pdf"), 30 * MB, 0, 0)[0] == "PODE"


def test_cpf_detectado_e_nao_confunde_cep_ou_telefone(tmp_path):
    a = escrever(tmp_path / "a.csv", "nome;doc\nfulana;123.456.789-09\n")
    b = escrever(tmp_path / "b.csv", "cep;tel\n13500-000;(19) 3522-1957\n3543907;2026-10-11\n")
    assert pv.contar_linhas_e_cpf(a)[1] == 1
    assert pv.contar_linhas_e_cpf(b) == (3, 0)


def test_relatorio_em_repositorio_falso_nao_altera_nada_e_so_aplica_pode(tmp_path):
    raiz = repo_falso(tmp_path)
    escrever(raiz / "web/dados/cep_indice.json", '{"ceps": {"13500001": [-22.4, -47.5, 100]}}')
    escrever(raiz / "docs/doc.pdf", b"%PDF-1.4 pequeno")
    escrever(raiz / "docs/pessoas.csv", "nome;cpf\nfulana;111.222.333-44\n")
    escrever(raiz / "docs/enorme.bin", b"x", tamanho=101 * MB)
    (raiz / ".gitignore").write_text("ignorado.txt\n")
    escrever(raiz / "ignorado.txt", "nao deve aparecer")
    itens = {c.name: (s, m) for s, c, m in pv.relatorio(raiz)}
    assert itens["cep_indice.json"][0] == "PODE" and itens["doc.pdf"][0] == "PODE"
    assert itens["pessoas.csv"][0] == "REVISAR" and "CPF" in itens["pessoas.csv"][1]
    assert itens["enorme.bin"][0] == "BLOQUEADO"
    assert "ignorado.txt" not in itens


def adicionados(raiz):
    return set(subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=raiz, capture_output=True, check=True)
               .stdout.decode().split())


def montar_cenario(raiz):
    repo_falso(raiz)
    escrever(raiz / "web/dados/cep_indice.json", '{"ceps": {}}')
    escrever(raiz / "docs/doc.pdf", b"%PDF-1.4 pequeno")
    escrever(raiz / "docs/pessoas.csv", "nome;cpf\nfulana;111.222.333-44\n")
    escrever(raiz / "docs/enorme.bin", b"x", tamanho=101 * MB)


def test_sem_aplicar_nao_mexe_no_git(tmp_path, capsys):
    montar_cenario(tmp_path)
    assert pv.main(["--raiz", str(tmp_path)]) == 0
    assert adicionados(tmp_path) == set()
    saida = capsys.readouterr().out
    assert "Nada foi alterado" in saida and "BLOQUEADO" in saida and "REVISAR" in saida


def test_aplicar_adiciona_so_os_arquivos_pode(tmp_path, capsys):
    montar_cenario(tmp_path)
    assert pv.main(["--raiz", str(tmp_path), "--aplicar"]) == 0
    assert adicionados(tmp_path) == {"web/dados/cep_indice.json", "docs/doc.pdf"}   # nem o CPF nem o de 101 MB
    assert "git add feito em 2" in capsys.readouterr().out


def test_pasta_sem_arquivos_novos(tmp_path, capsys):
    repo_falso(tmp_path)
    assert pv.main(["--raiz", str(tmp_path)]) == 0
    assert "Nao ha arquivos novos" in capsys.readouterr().out
