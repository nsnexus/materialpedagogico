// Tudo que é conteúdo editável da página fica aqui.
// Seções com lista vazia (bônus, depoimentos) ou autora sem nome não aparecem.

export const SITE = {
  marca: 'Baú Pedagógico',
  appId: 'bau-pedagogico',
  preco: 9.99,
  // Confirme o número real de arquivos do seu acervo antes de anunciar.
  qtdMateriais: '+25.000',
  whatsapp: '', // ex: '5581999999999' — mostra botão de suporte se preenchido

  categorias: [
    { icone: '🔤', titulo: 'Alfabetização e letramento' },
    { icone: '🔢', titulo: 'Matemática lúdica' },
    { icone: '🎲', titulo: 'Jogos educativos' },
    { icone: '📋', titulo: 'Planos de aula' },
    { icone: '🧩', titulo: 'Educação especial e inclusão' },
    { icone: '🎉', titulo: 'Datas comemorativas' },
    { icone: '🎨', titulo: 'Artes e coordenação motora' },
    { icone: '💬', titulo: 'Recursos terapêuticos' },
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
      'O Baú Pedagógico nasceu da vontade de reunir materiais que realmente facilitem a rotina de professores, famílias e profissionais que acompanham crianças com diferentes necessidades de aprendizagem.',
      'Tenho um carinho especial pela educação inclusiva e pelas famílias atípicas. Por isso, busco organizar atividades simples, adaptáveis e práticas, que ajudem tanto na sala de aula quanto em casa.',
      'O Baú foi criado para economizar o tempo de quem ensina e oferecer recursos que possam ser usados de verdade no dia a dia.',
    ],
    valores: ['💜 Educação inclusiva', '🏠 Famílias atípicas', '✂️ Simples e adaptável'],
  },

  // Só depoimentos reais, com autorização de quem escreveu.
  depoimentos: [
    // { nome: 'Profª Júlia', texto: '...' },
  ],

  faq: [
    {
      p: 'Como recebo o material?',
      r: 'Assim que o Pix for confirmado, o link de acesso aparece na tela na hora. Guarde esse link: ele é o seu acesso.',
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
      r: 'O acervo vai da educação infantil ao fundamental I, com uma seção dedicada à educação especial.',
    },
    {
      p: 'Preciso saber editar arquivos?',
      r: 'Não. A maior parte já vem pronta para imprimir e usar. Parte do material é editável para quem quiser personalizar.',
    },
  ],
};

export function formatBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
