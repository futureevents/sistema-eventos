-- ─────────────────────────────────────────────────────────────────────────────
-- Acessos & Permissões — Fase 1+2
--
-- Dois eixos:
--   • Papel global (membro_perfil.papel): teto de poder da pessoa.
--   • Acesso por escopo (acesso + escopo_privado): onde entra e com qual nível.
--
-- Escopo é um conceito de NAVEGAÇÃO (Space/Folder/List do nav.ts), não uma tabela.
-- Guardamos só o "slug" do escopo:
--   • space  → slug do space            ex.: 'marketing'
--   • folder → 'space/folder'           ex.: 'gestao/rotinas'
--   • list   → href da List sem a barra  ex.: 'gestao/rotinas/reunioes-internas'
--
-- Estas tabelas são lidas/escritas SOMENTE no servidor (admin client / server
-- actions). Por isso o RLS fica travado: nenhuma policy para `authenticated`.
-- Só a service_role (que ignora RLS) as toca. Ver src/lib/permissions/.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enums ----------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE papel_membro AS ENUM ('proprietario', 'administrador', 'membro', 'convidado');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE nivel_acesso AS ENUM ('ver', 'comentar', 'editar', 'total');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE escopo_tipo AS ENUM ('space', 'folder', 'list');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- Perfil do membro (papel global) --------------------------------------------
-- Chaveado por e-mail, no mesmo padrão de mcp_token (o e-mail é a identidade
-- estável; auth.users.id pode não existir ainda quando alguém é pré-cadastrado).

CREATE TABLE IF NOT EXISTS public.membro_perfil (
  email         text PRIMARY KEY,
  papel         papel_membro NOT NULL DEFAULT 'membro',
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Escopos privados: a simples PRESENÇA de uma linha torna o escopo privado
-- (some para Membros sem acesso explícito). Ausência = público.

CREATE TABLE IF NOT EXISTS public.escopo_privado (
  escopo_tipo escopo_tipo NOT NULL,
  escopo_slug text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (escopo_tipo, escopo_slug)
);

-- Concessões explícitas de acesso (pessoa · escopo · nível).
-- Usado para: liberar um escopo privado, rebaixar/elevar o nível em qualquer
-- escopo, e dar acesso pontual a Convidados.

CREATE TABLE IF NOT EXISTS public.acesso (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_email text NOT NULL,
  escopo_tipo  escopo_tipo NOT NULL,
  escopo_slug  text NOT NULL,
  nivel        nivel_acesso NOT NULL DEFAULT 'editar',
  criado_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membro_email, escopo_tipo, escopo_slug)
);

CREATE INDEX IF NOT EXISTS acesso_membro_idx ON public.acesso (membro_email);

-- RLS: travado. Sem policy para authenticated → só service_role acessa. --------

ALTER TABLE public.membro_perfil  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escopo_privado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acesso         ENABLE ROW LEVEL SECURITY;

-- Auto-provisão: todo usuário do sistema ganha um perfil (papel padrão membro),
-- no mesmo espírito do trigger de mcp_token.

CREATE OR REPLACE FUNCTION public.criar_membro_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.email IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM membro_perfil WHERE email = new.email) THEN
    INSERT INTO membro_perfil (email, papel) VALUES (new.email, 'membro');
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_membro_perfil ON auth.users;
CREATE TRIGGER trg_criar_membro_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_membro_perfil();

-- Backfill: cria perfil para quem já tem login.
INSERT INTO public.membro_perfil (email, papel)
SELECT u.email, 'membro'
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM membro_perfil p WHERE p.email = u.email);

-- Bootstrap anti-lock-out: o usuário mais antigo vira Proprietário, para que
-- exista alguém capaz de abrir a tela de Acessos e definir os demais papéis.
-- (Miguel pode reatribuir depois pela própria tela.)
UPDATE public.membro_perfil
SET papel = 'proprietario', atualizado_em = now()
WHERE email = (
  SELECT email FROM auth.users
  WHERE email IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1
);
