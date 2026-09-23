// Tudo que é conteúdo editável da página fica aqui.
// Seções com lista vazia (bônus, depoimentos) ou autora sem nome não aparecem.

export const SITE = {
  marca: 'Baú Pedagógico',
  appId: 'bau-pedagogico',
  preco: 9.99,
  // Número real de arquivos no portal (atualize quando subir material novo).
  qtdMateriais: '+25.000',
  whatsapp: '', // ex: '5581999999999' — mostra botão de suporte se preenchido

  categorias: [
    { icone: '🧸', titulo: 'Educação infantil' },
    { icone: '🔤', titulo: 'Português e linguagem' },
    { icone: '🧠', titulo: 'Atividades cognitivas' },
    { icone: '🎉', titulo: 'Datas comemorativas' },
    { icone: '🏫', titulo: 'Gestão escolar e projetos' },
    { icone: '🎒', titulo: 'Volta às aulas' },
  ],

  // Imagem principal do hero (em /public). Se vazio, usa o leque de fichas ilustradas.
  heroImagem: '/hero.jpg',
  // Ilustração da seção "domingo à noite". Se vazio, fica só o post-it.
  dorImagem: '/dor.jpg',

  // Prints reais de páginas do acervo (arquivos em /public/previews). Se preenchido,
  // substitui as fichas ilustradas na faixa "Espia só". Ex: ['/previews/01.jpg', '/previews/02.jpg']
  previews: [],

  // Só liste bônus que você realmente entrega.
  bonus: [
    // { titulo: 'Pack de capas editáveis no Canva', descricao: 'Modelos prontos para personalizar.' },
  ],

  autora: {
    nome: 'Jéssica Queiroz',
    titulo: 'Responsável pelo Baú Pedagógico',
    foto: '/autora.jpg',
    // Um item por parágrafo.
    texto: [
      'O Baú Pedagógico nasceu da vontade de reunir, num lugar só, materiais que realmente facilitem a rotina de professores, coordenadores e famílias que acompanham crianças na educação infantil e nos anos iniciais.',
      'Sei como é gastar a noite procurando atividade, montando ficha e adaptando projeto. Por isso organizei tudo por pastas: atividades para imprimir, cadernos de colorir, datas comemorativas e documentos de gestão escolar prontos para editar.',
      'O Baú foi criado para economizar o tempo de quem ensina e oferecer recursos que possam ser usados de verdade no dia a dia, na sala de aula ou em casa.',
    ],
    valores: ['⏱️ Menos tempo planejando', '🖨️ Pronto para imprimir', '✏️ Editável no Word'],
  },

  // Só depoimentos reais, com autorização de quem escreveu.
  depoimentos: [
    // { nome: 'Profª Júlia', texto: '...' },
  ],

  faq: [
    {
      p: 'Como recebo o material?',
      r: 'Na compra você cria um e-mail e senha. Assim que o Pix for confirmado, o portal com todos os materiais abre na hora, e você volta quando quiser pelo botão "Já comprei · Entrar".',
    },
    {
      p: 'Tem mensalidade?',
      r: 'Não. É um pagamento único de R$ 9,99 e o acesso é vitalício.',
    },
    {
      p: 'Funciona no celular?',
      r: 'Sim. Você acessa pelo celular, tablet ou computador, sem instalar nada. Para imprimir, basta baixar o arquivo.',
    },
    {
      p: 'Para qual faixa etária é o material?',
      r: 'O foco é a educação infantil e os anos iniciais. Também há materiais de gestão escolar: fichas pedagógicas, planos de ação e projetos.',
    },
    {
      p: 'Preciso saber editar arquivos?',
      r: 'Não. A maior parte vem em PDF, pronta para imprimir. Fichas, planos e projetos também vêm em Word, para editar com os dados da sua escola.',
    },
  ],
};

export function formatBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
