(function(){
  var WW = window.WebWord = window.WebWord || {};
  var Addons = WW.addons = WW.addons || {};

  var overlayEl = null;
  var dialogEl = null;
  var styleEl = null;

  function getEl(id, container){
    return (container || document).querySelector('#' + id);
  }

  // -------- 元素数据 --------
  var CATEGORIES = {
    nonmetal:    { label: '非金属',   cls: 'ptable-cat-nonmetal' },
    noble:       { label: '稀有气体', cls: 'ptable-cat-noble' },
    alkali:      { label: '碱金属',   cls: 'ptable-cat-alkali' },
    alkaline:    { label: '碱土金属', cls: 'ptable-cat-alkaline' },
    metalloid:   { label: '类金属',   cls: 'ptable-cat-metalloid' },
    halogen:     { label: '卤素',     cls: 'ptable-cat-halogen' },
    transition:  { label: '过渡金属', cls: 'ptable-cat-transition' },
    post:        { label: '后过渡金属', cls: 'ptable-cat-post' },
    lanthanide:  { label: '镧系元素', cls: 'ptable-cat-lanthanide' },
    actinide:    { label: '锕系元素', cls: 'ptable-cat-actinide' }
  };

  var ELEMENTS = [
    { z:1,  sym:'H',  en:'H',    cn:'氢',   mass:'1.008',    cat:'nonmetal',    row:1, col:1, conf:'1s¹',              enPaul:2.20,  mpt:'-259.1', bpt:'-252.9', density:'0.0000899' },
    { z:2,  sym:'He', en:'He',   cn:'氦',   mass:'4.003',    cat:'noble',       row:1, col:18,conf:'1s²',              enPaul:'—',   mpt:'-272.2', bpt:'-268.9', density:'0.0001785' },
    { z:3,  sym:'Li', en:'Li',   cn:'锂',   mass:'6.941',    cat:'alkali',      row:2, col:1, conf:'[He]2s¹',          enPaul:0.98,  mpt:'180.5',  bpt:'1342',   density:'0.534' },
    { z:4,  sym:'Be', en:'Be',   cn:'铍',   mass:'9.012',    cat:'alkaline',    row:2, col:2, conf:'[He]2s²',          enPaul:1.57,  mpt:'1287',   bpt:'2469',   density:'1.848' },
    { z:5,  sym:'B',  en:'B',    cn:'硼',   mass:'10.81',    cat:'metalloid',   row:2, col:13,conf:'[He]2s²2p¹',       enPaul:2.04,  mpt:'2075',   bpt:'4000',   density:'2.34' },
    { z:6,  sym:'C',  en:'C',    cn:'碳',   mass:'12.011',   cat:'nonmetal',    row:2, col:14,conf:'[He]2s²2p²',       enPaul:2.55,  mpt:'3550',   bpt:'4827',   density:'2.267' },
    { z:7,  sym:'N',  en:'N',    cn:'氮',   mass:'14.007',   cat:'nonmetal',    row:2, col:15,conf:'[He]2s²2p³',       enPaul:3.04,  mpt:'-209.9', bpt:'-195.8', density:'0.00125' },
    { z:8,  sym:'O',  en:'O',    cn:'氧',   mass:'15.999',   cat:'nonmetal',    row:2, col:16,conf:'[He]2s²2p⁴',       enPaul:3.44,  mpt:'-218.3', bpt:'-183',   density:'0.00143' },
    { z:9,  sym:'F',  en:'F',    cn:'氟',   mass:'18.998',   cat:'halogen',     row:2, col:17,conf:'[He]2s²2p⁵',       enPaul:3.98,  mpt:'-219.6', bpt:'-188.1', density:'0.00170' },
    { z:10, sym:'Ne', en:'Ne',   cn:'氖',   mass:'20.180',   cat:'noble',       row:2, col:18,conf:'[He]2s²2p⁶',       enPaul:'—',   mpt:'-248.6', bpt:'-246.1', density:'0.00090' },
    { z:11, sym:'Na', en:'Na',   cn:'钠',   mass:'22.990',   cat:'alkali',      row:3, col:1, conf:'[Ne]3s¹',          enPaul:0.93,  mpt:'97.72',  bpt:'883',    density:'0.968' },
    { z:12, sym:'Mg', en:'Mg',   cn:'镁',   mass:'24.305',   cat:'alkaline',    row:3, col:2, conf:'[Ne]3s²',          enPaul:1.31,  mpt:'650',    bpt:'1090',   density:'1.738' },
    { z:13, sym:'Al', en:'Al',   cn:'铝',   mass:'26.982',   cat:'post',        row:3, col:13,conf:'[Ne]3s²3p¹',       enPaul:1.61,  mpt:'660.3',  bpt:'2519',   density:'2.70' },
    { z:14, sym:'Si', en:'Si',   cn:'硅',   mass:'28.086',   cat:'metalloid',   row:3, col:14,conf:'[Ne]3s²3p²',       enPaul:1.90,  mpt:'1414',   bpt:'3265',   density:'2.33' },
    { z:15, sym:'P',  en:'P',    cn:'磷',   mass:'30.974',   cat:'nonmetal',    row:3, col:15,conf:'[Ne]3s²3p³',       enPaul:2.19,  mpt:'44.15',  bpt:'280',    density:'1.823' },
    { z:16, sym:'S',  en:'S',    cn:'硫',   mass:'32.065',   cat:'nonmetal',    row:3, col:16,conf:'[Ne]3s²3p⁴',       enPaul:2.58,  mpt:'115.2',  bpt:'444.6',  density:'2.07' },
    { z:17, sym:'Cl', en:'Cl',   cn:'氯',   mass:'35.453',   cat:'halogen',     row:3, col:17,conf:'[Ne]3s²3p⁵',       enPaul:3.16,  mpt:'-101.5', bpt:'-34.04', density:'0.00321' },
    { z:18, sym:'Ar', en:'Ar',   cn:'氩',   mass:'39.948',   cat:'noble',       row:3, col:18,conf:'[Ne]3s²3p⁶',       enPaul:'—',   mpt:'-189.4', bpt:'-185.8', density:'0.00178' },
    { z:19, sym:'K',  en:'K',    cn:'钾',   mass:'39.098',   cat:'alkali',      row:4, col:1, conf:'[Ar]4s¹',          enPaul:0.82,  mpt:'63.38',  bpt:'759',    density:'0.856' },
    { z:20, sym:'Ca', en:'Ca',   cn:'钙',   mass:'40.078',   cat:'alkaline',    row:4, col:2, conf:'[Ar]4s²',          enPaul:1.00,  mpt:'842',    bpt:'1484',   density:'1.55' },
    { z:21, sym:'Sc', en:'Sc',   cn:'钪',   mass:'44.956',   cat:'transition',  row:4, col:3, conf:'[Ar]3d¹4s²',       enPaul:1.36,  mpt:'1541',   bpt:'2836',   density:'2.985' },
    { z:22, sym:'Ti', en:'Ti',   cn:'钛',   mass:'47.867',   cat:'transition',  row:4, col:4, conf:'[Ar]3d²4s²',       enPaul:1.54,  mpt:'1668',   bpt:'3287',   density:'4.506' },
    { z:23, sym:'V',  en:'V',    cn:'钒',   mass:'50.942',   cat:'transition',  row:4, col:5, conf:'[Ar]3d³4s²',       enPaul:1.63,  mpt:'1910',   bpt:'3407',   density:'6.11' },
    { z:24, sym:'Cr', en:'Cr',   cn:'铬',   mass:'51.996',   cat:'transition',  row:4, col:6, conf:'[Ar]3d⁵4s¹',       enPaul:1.66,  mpt:'1907',   bpt:'2671',   density:'7.15' },
    { z:25, sym:'Mn', en:'Mn',   cn:'锰',   mass:'54.938',   cat:'transition',  row:4, col:7, conf:'[Ar]3d⁵4s²',       enPaul:1.55,  mpt:'1246',   bpt:'2061',   density:'7.47' },
    { z:26, sym:'Fe', en:'Fe',   cn:'铁',   mass:'55.845',   cat:'transition',  row:4, col:8, conf:'[Ar]3d⁶4s²',       enPaul:1.83,  mpt:'1538',   bpt:'2861',   density:'7.874' },
    { z:27, sym:'Co', en:'Co',   cn:'钴',   mass:'58.933',   cat:'transition',  row:4, col:9, conf:'[Ar]3d⁷4s²',       enPaul:1.88,  mpt:'1495',   bpt:'2927',   density:'8.90' },
    { z:28, sym:'Ni', en:'Ni',   cn:'镍',   mass:'58.693',   cat:'transition',  row:4, col:10,conf:'[Ar]3d⁸4s²',       enPaul:1.91,  mpt:'1455',   bpt:'2913',   density:'8.908' },
    { z:29, sym:'Cu', en:'Cu',   cn:'铜',   mass:'63.546',   cat:'transition',  row:4, col:11,conf:'[Ar]3d¹⁰4s¹',      enPaul:1.90,  mpt:'1085',   bpt:'2562',   density:'8.96' },
    { z:30, sym:'Zn', en:'Zn',   cn:'锌',   mass:'65.409',   cat:'transition',  row:4, col:12,conf:'[Ar]3d¹⁰4s²',      enPaul:1.65,  mpt:'419.5',  bpt:'907',    density:'7.14' },
    { z:31, sym:'Ga', en:'Ga',   cn:'镓',   mass:'69.723',   cat:'post',        row:4, col:13,conf:'[Ar]3d¹⁰4s²4p¹',   enPaul:1.81,  mpt:'29.76',  bpt:'2204',   density:'5.904' },
    { z:32, sym:'Ge', en:'Ge',   cn:'锗',   mass:'72.640',   cat:'metalloid',   row:4, col:14,conf:'[Ar]3d¹⁰4s²4p²',   enPaul:2.01,  mpt:'938.2',  bpt:'2833',   density:'5.323' },
    { z:33, sym:'As', en:'As',   cn:'砷',   mass:'74.922',   cat:'metalloid',   row:4, col:15,conf:'[Ar]3d¹⁰4s²4p³',   enPaul:2.18,  mpt:'817',    bpt:'614',    density:'5.727' },
    { z:34, sym:'Se', en:'Se',   cn:'硒',   mass:'78.963',   cat:'nonmetal',    row:4, col:16,conf:'[Ar]3d¹⁰4s²4p⁴',   enPaul:2.55,  mpt:'221',    bpt:'685',    density:'4.819' },
    { z:35, sym:'Br', en:'Br',   cn:'溴',   mass:'79.904',   cat:'halogen',     row:4, col:17,conf:'[Ar]3d¹⁰4s²4p⁵',   enPaul:2.96,  mpt:'-7.2',   bpt:'58.8',   density:'3.12' },
    { z:36, sym:'Kr', en:'Kr',   cn:'氪',   mass:'83.798',   cat:'noble',       row:4, col:18,conf:'[Ar]3d¹⁰4s²4p⁶',   enPaul:'—',   mpt:'-157.4', bpt:'-153.4', density:'0.00375' },
    { z:37, sym:'Rb', en:'Rb',   cn:'铷',   mass:'85.468',   cat:'alkali',      row:5, col:1, conf:'[Kr]5s¹',          enPaul:0.82,  mpt:'39.31',  bpt:'688',    density:'1.532' },
    { z:38, sym:'Sr', en:'Sr',   cn:'锶',   mass:'87.620',   cat:'alkaline',    row:5, col:2, conf:'[Kr]5s²',          enPaul:0.95,  mpt:'777',    bpt:'1382',   density:'2.64' },
    { z:39, sym:'Y',  en:'Y',    cn:'钇',   mass:'88.906',   cat:'transition',  row:5, col:3, conf:'[Kr]4d¹5s²',       enPaul:1.22,  mpt:'1526',   bpt:'3336',   density:'4.472' },
    { z:40, sym:'Zr', en:'Zr',   cn:'锆',   mass:'91.224',   cat:'transition',  row:5, col:4, conf:'[Kr]4d²5s²',       enPaul:1.33,  mpt:'1855',   bpt:'4409',   density:'6.52' },
    { z:41, sym:'Nb', en:'Nb',   cn:'铌',   mass:'92.906',   cat:'transition',  row:5, col:5, conf:'[Kr]4d⁴5s¹',       enPaul:1.60,  mpt:'2477',   bpt:'4744',   density:'8.57' },
    { z:42, sym:'Mo', en:'Mo',   cn:'钼',   mass:'95.960',   cat:'transition',  row:5, col:6, conf:'[Kr]4d⁵5s¹',       enPaul:2.16,  mpt:'2623',   bpt:'4639',   density:'10.28' },
    { z:43, sym:'Tc', en:'Tc',   cn:'锝',   mass:'98.000',   cat:'transition',  row:5, col:7, conf:'[Kr]4d⁵5s²',       enPaul:1.90,  mpt:'2157',   bpt:'4265',   density:'11.5' },
    { z:44, sym:'Ru', en:'Ru',   cn:'钌',   mass:'101.07',   cat:'transition',  row:5, col:8, conf:'[Kr]4d⁷5s¹',       enPaul:2.20,  mpt:'2334',   bpt:'4150',   density:'12.45' },
    { z:45, sym:'Rh', en:'Rh',   cn:'铑',   mass:'102.91',   cat:'transition',  row:5, col:9, conf:'[Kr]4d⁸5s¹',       enPaul:2.28,  mpt:'1964',   bpt:'3695',   density:'12.41' },
    { z:46, sym:'Pd', en:'Pd',   cn:'钯',   mass:'106.42',   cat:'transition',  row:5, col:10,conf:'[Kr]4d¹⁰',         enPaul:2.20,  mpt:'1555',   bpt:'2963',   density:'12.02' },
    { z:47, sym:'Ag', en:'Ag',   cn:'银',   mass:'107.87',   cat:'transition',  row:5, col:11,conf:'[Kr]4d¹⁰5s¹',      enPaul:1.93,  mpt:'961.8',  bpt:'2162',   density:'10.49' },
    { z:48, sym:'Cd', en:'Cd',   cn:'镉',   mass:'112.41',   cat:'transition',  row:5, col:12,conf:'[Kr]4d¹⁰5s²',      enPaul:1.69,  mpt:'321.1',  bpt:'767',    density:'8.65' },
    { z:49, sym:'In', en:'In',   cn:'铟',   mass:'114.82',   cat:'post',        row:5, col:13,conf:'[Kr]4d¹⁰5s²5p¹',   enPaul:1.78,  mpt:'156.6',  bpt:'2072',   density:'7.31' },
    { z:50, sym:'Sn', en:'Sn',   cn:'锡',   mass:'118.71',   cat:'post',        row:5, col:14,conf:'[Kr]4d¹⁰5s²5p²',   enPaul:1.96,  mpt:'231.9',  bpt:'2602',   density:'7.31' },
    { z:51, sym:'Sb', en:'Sb',   cn:'锑',   mass:'121.76',   cat:'metalloid',   row:5, col:15,conf:'[Kr]4d¹⁰5s²5p³',   enPaul:2.05,  mpt:'630.6',  bpt:'1587',   density:'6.697' },
    { z:52, sym:'Te', en:'Te',   cn:'碲',   mass:'127.60',   cat:'metalloid',   row:5, col:16,conf:'[Kr]4d¹⁰5s²5p⁴',   enPaul:2.10,  mpt:'449.5',  bpt:'988',    density:'6.24' },
    { z:53, sym:'I',  en:'I',    cn:'碘',   mass:'126.90',   cat:'halogen',     row:5, col:17,conf:'[Kr]4d¹⁰5s²5p⁵',   enPaul:2.66,  mpt:'113.7',  bpt:'184.3',  density:'4.933' },
    { z:54, sym:'Xe', en:'Xe',   cn:'氙',   mass:'131.29',   cat:'noble',       row:5, col:18,conf:'[Kr]4d¹⁰5s²5p⁶',   enPaul:'—',   mpt:'-111.8', bpt:'-108.1', density:'0.00589' },
    { z:55, sym:'Cs', en:'Cs',   cn:'铯',   mass:'132.91',   cat:'alkali',      row:6, col:1, conf:'[Xe]6s¹',          enPaul:0.79,  mpt:'28.44',  bpt:'671',    density:'1.93' },
    { z:56, sym:'Ba', en:'Ba',   cn:'钡',   mass:'137.33',   cat:'alkaline',    row:6, col:2, conf:'[Xe]6s²',          enPaul:0.89,  mpt:'727',    bpt:'1897',   density:'3.65' },
    // 镧系占位
    { z:57, sym:'La', en:'La',   cn:'镧',   mass:'138.91',   cat:'lanthanide',  row:6, col:4, conf:'',               enPaul:1.10,  mpt:'920',    bpt:'3464',   density:'6.15' },
    { z:58, sym:'Ce', en:'Ce',   cn:'铈',   mass:'140.12',   cat:'lanthanide',  row:6, col:5, conf:'',               enPaul:1.12,  mpt:'798',    bpt:'3443',   density:'6.77' },
    { z:59, sym:'Pr', en:'Pr',   cn:'镨',   mass:'140.91',   cat:'lanthanide',  row:6, col:6, conf:'',               enPaul:1.13,  mpt:'931',    bpt:'3520',   density:'6.77' },
    { z:60, sym:'Nd', en:'Nd',   cn:'钕',   mass:'144.24',   cat:'lanthanide',  row:6, col:7, conf:'',               enPaul:1.14,  mpt:'1016',   bpt:'3127',   density:'7.01' },
    { z:61, sym:'Pm', en:'Pm',   cn:'钷',   mass:'145.00',   cat:'lanthanide',  row:6, col:8, conf:'',               enPaul:'—',   mpt:'1042',   bpt:'3000',   density:'7.26' },
    { z:62, sym:'Sm', en:'Sm',   cn:'钐',   mass:'150.36',   cat:'lanthanide',  row:6, col:9, conf:'',               enPaul:1.17,  mpt:'1072',   bpt:'1794',   density:'7.52' },
    { z:63, sym:'Eu', en:'Eu',   cn:'铕',   mass:'151.96',   cat:'lanthanide',  row:6, col:10,conf:'',               enPaul:'—',   mpt:'822',    bpt:'1529',   density:'5.24' },
    { z:64, sym:'Gd', en:'Gd',   cn:'钆',   mass:'157.25',   cat:'lanthanide',  row:6, col:11,conf:'',               enPaul:1.20,  mpt:'1313',   bpt:'3273',   density:'7.90' },
    { z:65, sym:'Tb', en:'Tb',   cn:'铽',   mass:'158.93',   cat:'lanthanide',  row:6, col:12,conf:'',               enPaul:'—',   mpt:'1356',   bpt:'3230',   density:'8.23' },
    { z:66, sym:'Dy', en:'Dy',   cn:'镝',   mass:'162.50',   cat:'lanthanide',  row:6, col:13,conf:'',               enPaul:1.22,  mpt:'1412',   bpt:'2567',   density:'8.55' },
    { z:67, sym:'Ho', en:'Ho',   cn:'钬',   mass:'164.93',   cat:'lanthanide',  row:6, col:14,conf:'',               enPaul:1.23,  mpt:'1474',   bpt:'2700',   density:'8.80' },
    { z:68, sym:'Er', en:'Er',   cn:'铒',   mass:'167.26',   cat:'lanthanide',  row:6, col:15,conf:'',               enPaul:1.24,  mpt:'1529',   bpt:'2868',   density:'9.07' },
    { z:69, sym:'Tm', en:'Tm',   cn:'铥',   mass:'168.93',   cat:'lanthanide',  row:6, col:16,conf:'',               enPaul:1.25,  mpt:'1545',   bpt:'1950',   density:'9.32' },
    { z:70, sym:'Yb', en:'Yb',   cn:'镱',   mass:'173.04',   cat:'lanthanide',  row:6, col:17,conf:'',               enPaul:'—',   mpt:'824',    bpt:'1196',   density:'6.90' },
    { z:71, sym:'Lu', en:'Lu',   cn:'镥',   mass:'174.97',   cat:'lanthanide',  row:6, col:18,conf:'',               enPaul:1.27,  mpt:'1663',   bpt:'3402',   density:'9.84' },
    { z:72, sym:'Hf', en:'Hf',   cn:'铪',   mass:'178.49',   cat:'transition',  row:6, col:4, conf:'[Xe]4f¹⁴5d²6s²',  enPaul:1.30,  mpt:'2233',   bpt:'4603',   density:'13.31' },
    { z:73, sym:'Ta', en:'Ta',   cn:'钽',   mass:'180.95',   cat:'transition',  row:6, col:5, conf:'[Xe]4f¹⁴5d³6s²',  enPaul:1.50,  mpt:'3017',   bpt:'5458',   density:'16.65' },
    { z:74, sym:'W',  en:'W',    cn:'钨',   mass:'183.84',   cat:'transition',  row:6, col:6, conf:'[Xe]4f¹⁴5d⁴6s²',  enPaul:2.36,  mpt:'3422',   bpt:'5555',   density:'19.25' },
    { z:75, sym:'Re', en:'Re',   cn:'铼',   mass:'186.21',   cat:'transition',  row:6, col:7, conf:'[Xe]4f¹⁴5d⁵6s²',  enPaul:1.90,  mpt:'3186',   bpt:'5596',   density:'21.02' },
    { z:76, sym:'Os', en:'Os',   cn:'锇',   mass:'190.23',   cat:'transition',  row:6, col:8, conf:'[Xe]4f¹⁴5d⁶6s²',  enPaul:2.20,  mpt:'3033',   bpt:'5012',   density:'22.59' },
    { z:77, sym:'Ir', en:'Ir',   cn:'铱',   mass:'192.22',   cat:'transition',  row:6, col:9, conf:'[Xe]4f¹⁴5d⁷6s²',  enPaul:2.20,  mpt:'2446',   bpt:'4428',   density:'22.56' },
    { z:78, sym:'Pt', en:'Pt',   cn:'铂',   mass:'195.08',   cat:'transition',  row:6, col:10,conf:'[Xe]4f¹⁴5d⁹6s¹',  enPaul:2.28,  mpt:'1768',   bpt:'3825',   density:'21.45' },
    { z:79, sym:'Au', en:'Au',   cn:'金',   mass:'196.97',   cat:'transition',  row:6, col:11,conf:'[Xe]4f¹⁴5d¹⁰6s¹', enPaul:2.54,  mpt:'1064',   bpt:'2856',   density:'19.32' },
    { z:80, sym:'Hg', en:'Hg',   cn:'汞',   mass:'200.59',   cat:'transition',  row:6, col:12,conf:'[Xe]4f¹⁴5d¹⁰6s²', enPaul:2.00,  mpt:'-38.83', bpt:'356.7',  density:'13.534' },
    { z:81, sym:'Tl', en:'Tl',   cn:'铊',   mass:'204.38',   cat:'post',        row:6, col:13,conf:'[Xe]4f¹⁴5d¹⁰6s²6p¹',enPaul:1.80,  mpt:'304',    bpt:'1473',   density:'11.85' },
    { z:82, sym:'Pb', en:'Pb',   cn:'铅',   mass:'207.20',   cat:'post',        row:6, col:14,conf:'[Xe]4f¹⁴5d¹⁰6s²6p²',enPaul:2.33,  mpt:'327.5',  bpt:'1749',   density:'11.34' },
    { z:83, sym:'Bi', en:'Bi',   cn:'铋',   mass:'208.98',   cat:'post',        row:6, col:15,conf:'[Xe]4f¹⁴5d¹⁰6s²6p³',enPaul:2.02,  mpt:'271.4',  bpt:'1564',   density:'9.78' },
    { z:84, sym:'Po', en:'Po',   cn:'钋',   mass:'209.00',   cat:'post',        row:6, col:16,conf:'[Xe]4f¹⁴5d¹⁰6s²6p⁴',enPaul:2.00,  mpt:'254',    bpt:'962',    density:'9.20' },
    { z:85, sym:'At', en:'At',   cn:'砹',   mass:'210.00',   cat:'halogen',     row:6, col:17,conf:'[Xe]4f¹⁴5d¹⁰6s²6p⁵',enPaul:2.20,  mpt:'302',    bpt:'337',    density:'6.35' },
    { z:86, sym:'Rn', en:'Rn',   cn:'氡',   mass:'222.00',   cat:'noble',       row:6, col:18,conf:'[Xe]4f¹⁴5d¹⁰6s²6p⁶',enPaul:'—',   mpt:'-71',    bpt:'-61.7',  density:'0.00973' },
    { z:87, sym:'Fr', en:'Fr',   cn:'钫',   mass:'223.00',   cat:'alkali',      row:7, col:1, conf:'[Rn]7s¹',          enPaul:0.70,  mpt:'27',     bpt:'677',    density:'—' },
    { z:88, sym:'Ra', en:'Ra',   cn:'镭',   mass:'226.00',   cat:'alkaline',    row:7, col:2, conf:'[Rn]7s²',          enPaul:0.90,  mpt:'700',    bpt:'1737',   density:'5.50' },
    // 锕系占位
    { z:89, sym:'Ac', en:'Ac',   cn:'锕',   mass:'227.00',   cat:'actinide',    row:7, col:4, conf:'',               enPaul:1.10,  mpt:'1050',   bpt:'3200',   density:'10.07' },
    { z:90, sym:'Th', en:'Th',   cn:'钍',   mass:'232.04',   cat:'actinide',    row:7, col:5, conf:'',               enPaul:1.30,  mpt:'1750',   bpt:'4788',   density:'11.72' },
    { z:91, sym:'Pa', en:'Pa',   cn:'镤',   mass:'231.04',   cat:'actinide',    row:7, col:6, conf:'',               enPaul:1.50,  mpt:'1572',   bpt:'4000',   density:'15.37' },
    { z:92, sym:'U',  en:'U',    cn:'铀',   mass:'238.03',   cat:'actinide',    row:7, col:7, conf:'',               enPaul:1.38,  mpt:'1132',   bpt:'4131',   density:'18.95' },
    { z:93, sym:'Np', en:'Np',   cn:'镎',   mass:'237.00',   cat:'actinide',    row:7, col:8, conf:'',               enPaul:1.36,  mpt:'639',    bpt:'4000',   density:'20.45' },
    { z:94, sym:'Pu', en:'Pu',   cn:'钚',   mass:'244.00',   cat:'actinide',    row:7, col:9, conf:'',               enPaul:1.28,  mpt:'640',    bpt:'3228',   density:'19.84' },
    { z:95, sym:'Am', en:'Am',   cn:'镅',   mass:'243.00',   cat:'actinide',    row:7, col:10,conf:'',               enPaul:1.30,  mpt:'994',    bpt:'2607',   density:'13.69' },
    { z:96, sym:'Cm', en:'Cm',   cn:'锔',   mass:'247.00',   cat:'actinide',    row:7, col:11,conf:'',               enPaul:1.30,  mpt:'1345',   bpt:'3100',   density:'13.51' },
    { z:97, sym:'Bk', en:'Bk',   cn:'锫',   mass:'247.00',   cat:'actinide',    row:7, col:12,conf:'',               enPaul:1.30,  mpt:'986',    bpt:'—',      density:'14.78' },
    { z:98, sym:'Cf', en:'Cf',   cn:'锎',   mass:'251.00',   cat:'actinide',    row:7, col:13,conf:'',               enPaul:1.30,  mpt:'900',    bpt:'—',      density:'15.10' },
    { z:99, sym:'Es', en:'Es',   cn:'锿',   mass:'252.00',   cat:'actinide',    row:7, col:14,conf:'',               enPaul:1.30,  mpt:'860',    bpt:'—',      density:'13.50' },
    { z:100,sym:'Fm', en:'Fm',   cn:'镄',   mass:'257.00',   cat:'actinide',    row:7, col:15,conf:'',               enPaul:1.30,  mpt:'1527',   bpt:'—',      density:'—' },
    { z:101,sym:'Md', en:'Md',   cn:'钔',   mass:'258.00',   cat:'actinide',    row:7, col:16,conf:'',               enPaul:1.30,  mpt:'827',    bpt:'—',      density:'—' },
    { z:102,sym:'No', en:'No',   cn:'锘',   mass:'259.00',   cat:'actinide',    row:7, col:17,conf:'',               enPaul:1.30,  mpt:'827',    bpt:'—',      density:'—' },
    { z:103,sym:'Lr', en:'Lr',   cn:'铹',   mass:'262.00',   cat:'actinide',    row:7, col:18,conf:'',               enPaul:'—',   mpt:'1627',   bpt:'—',      density:'—' },
    { z:104,sym:'Rf', en:'Rf',   cn:'𬬻',   mass:'267.00',   cat:'transition',  row:7, col:4, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:105,sym:'Db', en:'Db',   cn:'𬭊',   mass:'268.00',   cat:'transition',  row:7, col:5, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:106,sym:'Sg', en:'Sg',   cn:'𬭳',   mass:'269.00',   cat:'transition',  row:7, col:6, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:107,sym:'Bh', en:'Bh',   cn:'𬭛',   mass:'270.00',   cat:'transition',  row:7, col:7, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:108,sym:'Hs', en:'Hs',   cn:'𬭶',   mass:'269.00',   cat:'transition',  row:7, col:8, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:109,sym:'Mt', en:'Mt',   cn:'鿏',   mass:'278.00',   cat:'transition',  row:7, col:9, conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:110,sym:'Ds', en:'Ds',   cn:'𫟼',   mass:'281.00',   cat:'transition',  row:7, col:10,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:111,sym:'Rg', en:'Rg',   cn:'𬬭',   mass:'282.00',   cat:'transition',  row:7, col:11,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:112,sym:'Cn', en:'Cn',   cn:'鎶',   mass:'285.00',   cat:'transition',  row:7, col:12,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:113,sym:'Nh', en:'Nh',   cn:'鉨',   mass:'286.00',   cat:'post',        row:7, col:13,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:114,sym:'Fl', en:'Fl',   cn:'𫓧',   mass:'289.00',   cat:'post',        row:7, col:14,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:115,sym:'Mc', en:'Mc',   cn:'镆',   mass:'290.00',   cat:'post',        row:7, col:15,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:116,sym:'Lv', en:'Lv',   cn:'𫟷',   mass:'293.00',   cat:'post',        row:7, col:16,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:117,sym:'Ts', en:'Ts',   cn:'鿬',   mass:'294.00',   cat:'halogen',     row:7, col:17,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' },
    { z:118,sym:'Og', en:'Og',   cn:'鿫',   mass:'294.00',   cat:'noble',       row:7, col:18,conf:'',               enPaul:'—',   mpt:'—',      bpt:'—',      density:'—' }
  ];

  // 构建元素映射
  var ELEM_MAP = {};
  var ELEM_BY_SYMBOL = {};
  ELEMENTS.forEach(function(e){
    ELEM_MAP[e.row + '-' + e.col] = e;
    ELEM_BY_SYMBOL[e.sym.toLowerCase()] = e;
  });

  function renderLegend(container){
    var legend = getEl('ptableLegend', container);
    if(!legend) return;
    legend.innerHTML = '';
    var keys = Object.keys(CATEGORIES);
    keys.forEach(function(key){
      var cat = CATEGORIES[key];
      var item = document.createElement('div');
      item.className = 'ptable-legend-item';
      item.innerHTML = '<span class="ptable-legend-dot ' + cat.cls + '"></span>' + cat.label;
      legend.appendChild(item);
    });
  }

  function renderGrid(container, searchText){
    var grid = getEl('ptableGrid', container);
    if(!grid) return;

    // ---- 主网格: 7 行 × 18 列 ----
    var html = '';
    for(var r = 1; r <= 7; r++){
      for(var c = 1; c <= 18; c++){
        var key = r + '-' + c;
        var elem = ELEM_MAP[key];
        if(elem && r <= 7 && c <= 18 && !(r >= 6 && c > 3 && (elem.cat === 'lanthanide' || elem.cat === 'actinide'))){
          var highlight = false;
          if(searchText){
            var kw = searchText.toLowerCase();
            highlight = elem.sym.toLowerCase().indexOf(kw) !== -1 ||
                        elem.cn.indexOf(kw) !== -1 ||
                        elem.en.toLowerCase().indexOf(kw) !== -1;
          }
          var catCls = CATEGORIES[elem.cat] ? CATEGORIES[elem.cat].cls : 'ptable-cat-other';
          html += '<div class="ptable-element ' + catCls + (highlight ? ' highlight' : '') + '" data-z="' + elem.z + '" data-row="' + r + '" data-col="' + c + '">' +
            '<span class="ptable-elem-num">' + elem.z + '</span>' +
            '<span class="ptable-elem-symbol">' + elem.sym + '</span>' +
            '<span class="ptable-elem-mass">' + elem.mass + '</span>' +
          '</div>';
        } else {
          // 占位: 57-71/89-103 标记
          if(r === 6 && c === 3){
            html += '<div class="ptable-element empty ptable-series-indicator" data-series="lanthanide">57-71</div>';
          } else if(r === 7 && c === 3){
            html += '<div class="ptable-element empty ptable-series-indicator" data-series="actinide">89-103</div>';
          } else {
            html += '<div class="ptable-element empty"></div>';
          }
        }
      }
    }
    grid.innerHTML = html;

    // ---- 副表: 镧系 + 锕系 ----
    var lanthanides = ELEMENTS.filter(function(e){ return e.cat === 'lanthanide'; });
    var actinides = ELEMENTS.filter(function(e){ return e.cat === 'actinide'; });

    function renderSeriesGrid(containerId, elements, searchText){
      var grid = getEl(containerId, container);
      if(!grid) return;
      var h = '';
      for(var i = 0; i < elements.length; i++){
        var elem = elements[i];
        var highlight = false;
        if(searchText){
          var kw = searchText.toLowerCase();
          highlight = elem.sym.toLowerCase().indexOf(kw) !== -1 ||
                      elem.cn.indexOf(kw) !== -1 ||
                      elem.en.toLowerCase().indexOf(kw) !== -1;
        }
        var catCls = CATEGORIES[elem.cat] ? CATEGORIES[elem.cat].cls : 'ptable-cat-other';
        h += '<div class="ptable-element ' + catCls + (highlight ? ' highlight' : '') + '" data-z="' + elem.z + '">' +
          '<span class="ptable-elem-num">' + elem.z + '</span>' +
          '<span class="ptable-elem-symbol">' + elem.sym + '</span>' +
          '<span class="ptable-elem-mass">' + elem.mass + '</span>' +
        '</div>';
      }
      grid.innerHTML = h;
    }

    renderSeriesGrid('ptableLanthanide', lanthanides, searchText);
    renderSeriesGrid('ptableActinide', actinides, searchText);

    // ---- 绑定点击事件 ----
    function bindClicks(scope){
      scope.querySelectorAll('.ptable-element:not(.empty)').forEach(function(el){
        el.addEventListener('click', function(){
          var z = parseInt(this.getAttribute('data-z'), 10);
          var elem = null;
          for(var i = 0; i < ELEMENTS.length; i++){
            if(ELEMENTS[i].z === z){ elem = ELEMENTS[i]; break; }
          }
          if(elem) showDetail(container, elem);
        });
      });
    }
    bindClicks(grid);
    var lGrid = getEl('ptableLanthanide', container);
    var aGrid = getEl('ptableActinide', container);
    if(lGrid) bindClicks(lGrid);
    if(aGrid) bindClicks(aGrid);

    // 点击 "57-71" / "89-103" 指示器跳转到副表
    var indicators = grid.querySelectorAll('.ptable-series-indicator');
    for(var si = 0; si < indicators.length; si++){
      (function(ind){
        ind.addEventListener('click', function(){
          var series = this.getAttribute('data-series');
          var target = getEl(series === 'lanthanide' ? 'ptableLanthanide' : 'ptableActinide', container);
          if(target){
            target.closest('.ptable-series').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      })(indicators[si]);
    }
  }

  var PERIOD_MAP = {
    1:'第一周期',2:'第二周期',3:'第三周期',4:'第四周期',
    5:'第五周期',6:'第六周期',7:'第七周期'
  };

  var ELEM_DESC = {
    H: '宇宙中最丰富的元素，是恒星核聚变的主要燃料。无色无味，是最轻的气体。',
    He: '惰性气体，宇宙中第二丰富的元素。密度极低，用于气球、低温超导冷却和深海潜水呼吸气。',
    Li: '最轻的金属，遇水剧烈反应。广泛用于锂电池和航空航天合金。锂盐用于治疗躁郁症。',
    Be: '轻质碱土金属，具有高熔点和高刚度。用于航空航天结构和X射线窗。铍及其化合物有毒性。',
    B: '类金属元素，以硼砂形式存在。用于玻璃和陶瓷制造，硼纤维是轻质高强复合材料。硼酸用作消毒剂。',
    C: '生命的基础元素，可形成金刚石、石墨、石墨烯等多种同素异形体。有机化学的核心元素。',
    N: '空气中的主要成分（78%），无色无味。是蛋白质和DNA的关键组成，用于氨肥生产和制冷剂。',
    O: '生命必需元素，占地壳质量的近一半。无色无味，支持燃烧，用于呼吸支持和钢铁冶炼。',
    F: '最活泼的非金属元素，最强的氧化剂。用于制备含氟化合物、牙膏中的氟化物和特氟龙。',
    Ne: '稀有气体，通电时发出鲜明的橙红色光。用于霓虹灯、高压指示剂和激光器。',
    Na: '活泼碱金属，与水剧烈反应放出氢气。氯化钠是食盐，钠离子对神经传导至关重要。',
    Mg: '轻质结构金属，燃烧时发出耀眼白光。叶绿素的核心元素，用于航空合金和烟花。',
    Al: '地壳中最丰富的金属元素。质轻、耐腐蚀，广泛用于飞机、汽车、包装和建筑材料。',
    Si: '半导体材料，是现代电子工业的基石。地壳中第二丰富的元素，是沙子和玻璃的主要成分。',
    P: '生命必需元素，是ATP和DNA的关键组成。白磷高度活泼且有毒，红磷用于安全火柴。',
    S: '黄色固体，火山地区常见。是蛋白质中二硫键的组成元素，用于硫酸制造和橡胶硫化。',
    Cl: '黄绿色有毒气体，有刺激性气味。用于水消毒、塑料制造（PVC）和漂白剂。',
    Ar: '空气中的第三丰富气体（0.93%），无色无味。用作焊接保护气和白炽灯填充气。',
    K: '重要电解质，调节神经和肌肉功能。钾肥是关键农业肥料，金属钾遇水剧烈燃烧。',
    Ca: '骨骼和牙齿的核心成分，参与血液凝固和神经传导。碳酸钙是石灰石和大理石的主要成分。',
    Sc: '稀土元素之一，质轻而熔点高。用于航空航天铝合金和运动器材，产量稀少。',
    Ti: '银白色过渡金属，强度高、耐腐蚀、生物相容性好。用于飞机引擎、人工关节和钛白粉颜料。',
    V: '灰白色金属，用于生产高强度合金钢。五氧化二钒是硫酸生产的催化剂。钒是某些海洋生物的血液成分。',
    Cr: '硬质银白色金属，用于不锈钢制造和镀铬装饰。三价铬是人体必需微量元素。',
    Mn: '灰白色金属，是钢铁工业重要添加剂。锰是多种酶的活性中心，参与骨骼发育。',
    Fe: '地球上最重要的结构金属，地核的主要成分。血红蛋白的核心元素，负责氧运输。',
    Co: '铁磁性金属，用于高温合金、电池和蓝色陶瓷颜料。维生素B12的必需微量元素。',
    Ni: '银白色金属，耐腐蚀。广泛用于不锈钢、镍氢电池和电镀。某些镍化合物被怀疑致癌。',
    Cu: '紫红色金属，优异的导电和导热材料。用于电线、管道和电子元件。铜是多种酶的辅因子。',
    Zn: '青白色金属，用于镀锌防锈和制造黄铜。锌是人体必需微量元素，参与免疫和细胞分裂。',
    Ga: '银白色软金属，熔点仅29.8°C。用于半导体（GaAs、GaN）、LED和高温温度计。',
    Ge: '灰白色类金属，是重要的半导体材料。用于光纤通信、红外光学和电子器件。',
    As: '灰白色类金属，三氧化二砷是传统毒药。少量用于半导体掺杂和木材防腐。有毒且致癌。',
    Se: '红色或灰色非金属，是人体必需微量元素。用于玻璃脱色、光电元件和抗静电剂。',
    Br: '红棕色液体，是室温下唯一的液态非金属。用于阻燃剂、摄影化学和消毒剂。',
    Kr: '稀有气体，用于高性能白炽灯和激光器。氪-85用于工业测厚和泄漏检测。',
    Rb: '活泼碱金属，遇空气自燃。用于特种玻璃、烟花和原子钟研究。铷-87用于量子计算。',
    Sr: '碱土金属，燃烧时发出鲜艳的红色火焰。用于烟花和信号弹，锶-90是核废料成分。',
    Y: '稀土金属，用于激光晶体（YAG）和超导材料。钇铝石榴石是仿钻石的宝石。',
    Zr: '银白色金属，对中子吸收截面极低。用作核反应堆包壳材料，也用于耐腐蚀合金。',
    Nb: '灰白色金属，加入钢中提高强度。用于超导磁体和航空航天合金。铌合金用于火箭喷嘴。',
    Mo: '银白色难熔金属，熔点极高。用于高速钢和高温合金，钼是多种酶的必需元素。',
    Tc: '第一个用人工方法合成的元素。银灰色放射性金属，用于核医学成像（Tc-99m）。',
    Ru: '铂族金属，极硬且耐腐蚀。用于电子触点、厚膜电阻和催化剂。钌配合物用于抗癌研究。',
    Rh: '铂族金属，是催化转化器的核心催化剂。铑镀层用于珠宝饰品和光学镜面。',
    Pd: '铂族金属，是加氢反应和催化转换器的关键催化剂。用于储氢合金和电子接插件。',
    Ag: '白色贵金属，具有最佳的导电和导热性能。用于银器、摄影、太阳能电池和抗菌材料。',
    Cd: '蓝白色金属，用于镍镉电池和太阳能电池。镉及其化合物有毒，可导致骨软化。',
    In: '银白色软金属，用于透明导电薄膜（ITO）和平板显示器。用于低温焊料和光伏电池。',
    Sn: '银白色金属，耐腐蚀。用于食品罐头的镀锡层、焊料和青铜合金。锡箔是常见包装材料。',
    Sb: '银白色类金属，用于阻燃剂、铅酸电池和半导体。锑合金用于军用弹药。',
    Te: '银白色类金属，用于热电材料、橡胶硫化和玻璃着色。是重要的p型半导体材料。',
    I: '紫色固体，加热升华为紫色蒸汽。碘是甲状腺激素的必需成分，碘酒是常用消毒剂。',
    Xe: '稀有气体，用于闪光灯、等离子显示器和麻醉剂。氙-135是核反应堆的毒物。',
    Cs: '最活泼的金属，遇水爆炸。铯-133用于原子钟定义秒长。用于钻井液和特种玻璃。',
    Ba: '碱土金属，用于胃肠造影（钡餐）、烟花和真空管吸气剂。可溶性钡盐有毒。',
    La: '镧系元素中第一个，银白色稀土金属。用于相机镜头、储氢合金和镍氢电池。',
    Ce: '镧系元素，用于抛光玻璃和陶瓷、催化转换器和自清洁烤箱。是最丰富的稀土元素。',
    Pr: '镧系元素，用于飞机引擎合金和磁性材料。镨钕混合物用于制造强力永磁体。',
    Nd: '镧系元素，NdFeB永磁体是最强商用磁铁。用于风力发电机、电动汽车和硬盘。',
    Pm: '镧系元素，所有同位素均有放射性。钷-147用于荧光涂料和微型核电池。',
    Sm: '镧系元素，钐钴永磁体具有高耐温性。用于微波通信、传感器和行波管。',
    Eu: '镧系元素，是红色荧光粉的核心成分。用于彩色电视、LED照明和防伪油墨。',
    Gd: '镧系元素，具有最大的中子俘获截面。用于核反应堆控制棒和MRI造影剂。',
    Tb: '镧系元素，用于绿色荧光粉和磁致伸缩材料（Terfenol-D）。用于声纳和传感器。',
    Dy: '镧系元素，用于高性能永磁体和磁致伸缩材料。镝在核反应堆中用作中子吸收剂。',
    Ho: '镧系元素，具有最高的磁矩。用于定制磁性材料和激光玻璃。氧化钬用于玻璃着色。',
    Er: '镧系元素，用于光纤通信放大器和激光器。氧化铒使玻璃呈现粉红色。',
    Tm: '镧系元素，用于便携式X射线装置和激光晶体。是稀土中含量最少的元素之一。',
    Yb: '镧系元素，用于不锈钢冶金和激光器。镱-169用于便携式伽马射线源。',
    Lu: '镧系元素中最后一个，最重的稀土。用于PET扫描闪烁晶体和催化裂化。',
    Hf: '银白色金属，化学性质与锆相似。用于核反应堆控制棒、高温合金和等离子切割。',
    Ta: '难熔金属，熔点极高。用于电子电容器、高温合金和外科植入物。',
    W: '熔点最高的金属（3422°C）。用于灯丝、穿甲弹和高温工具钢。',
    Re: '最难熔的金属之一，熔点3186°C。用于高温合金、催化剂和电子灯丝。',
    Os: '密度最高的天然元素（22.59 g/cm³）。用于超硬合金和电子触点。锇酸用于染色。',
    Ir: '最耐腐蚀的金属，铂族元素。用于火花塞、坩埚和航天推进剂催化剂。',
    Pt: '贵金属，优良的催化活性。用于催化转化器、珠宝、抗癌药物和电极。',
    Au: '最著名的贵金属，极耐腐蚀。用于珠宝、电子接插件、航天镀层和金本位储备。',
    Hg: '唯一在室温下为液体的金属。用于温度计、气压计和荧光灯。汞及其化合物毒性极强。',
    Tl: '灰白色软金属，铊盐是烈性毒药。用于红外光学、超导材料和电子器件。',
    Pb: '重金属，柔软且耐腐蚀。用于铅酸电池、辐射屏蔽和铅字合金。铅对人体有毒。',
    Bi: '银白色脆金属，无毒。用于胃药、化妆品和高温超导材料。铋合金熔点在低熔点焊料中应用。',
    Po: '放射性元素，极稀有的天然元素。钋-210是强α放射源，用于消除静电。',
    At: '最稀有的天然元素，所有同位素放射性。砹-211用于靶向α粒子放射治疗。',
    Rn: '放射性稀有气体，由镭衰变产生。氡气是居室肺癌的第二大诱因。',
    Fr: '最活泼的碱金属，极稀有且高度放射性。钫-223是最稳定的同位素，半衰期仅22分钟。',
    Ra: '放射性碱土金属，居里夫人从沥青铀矿中首次提取。镭-226曾用于发光涂料。',
    Ac: '放射性元素，是锕系元素第一个。银白色金属，用于中子源和放射性治疗。',
    Th: '放射性元素，在地壳中比铀更丰富。钍-232可用于下一代核反应堆燃料。',
    Pa: '放射性元素，稀有且毒性强。镤-231半衰期3.3万年，存在于铀矿中。',
    U: '天然放射性元素，主要核燃料。铀-235用于核电站和核武器，贫铀用于穿甲弹。',
    Np: '第一个人工合成的超铀元素。镎-237半衰期214万年，用于中子探测。',
    Pu: '人工放射性元素，核武器和快中子反应堆燃料。钚-238用于航天器热电发生器。',
    Am: '人工合成元素，用于家用烟雾探测器和测厚仪。镅-241是最常用的同位素。',
    Cm: '人工合成元素，用于放射性同位素热电发电机。锔-242用于太空探测器供电。',
    Bk: '人工合成元素，由锔靶轰击α粒子制得。锫-249半衰期330天。',
    Cf: '人工合成元素，是中子源材料。锎-252是强中子发射体，用于癌症治疗和工业检测。',
    Es: '人工合成元素，以爱因斯坦命名。锿-253半衰期20.5天。',
    Fm: '人工合成元素，以费米命名。产量极少，主要用于基础研究。',
    Md: '人工合成元素，以门捷列夫命名。钔-258半衰期约51天。',
    No: '人工合成元素，以诺贝尔命名。锘-259半衰期约58分钟。',
    Lr: '人工合成元素，以劳伦斯命名。铹-262半衰期约3.6小时。',
    Rf: '人工合成元素，以卢瑟福命名。𬬻-267半衰期约1.3小时。',
    Db: '人工合成元素，以杜布纳联合核子所命名。𬭊-268半衰期约29小时。',
    Sg: '人工合成元素，以西博格命名。𬭳-269半衰期约2.1分钟。',
    Bh: '人工合成元素，以玻尔命名。𬭛-270半衰期约61秒。',
    Hs: '人工合成元素，以黑森州命名。𬭶-270半衰期约3.6秒。',
    Mt: '人工合成元素，以迈特纳命名。鿏-278半衰期约7.6秒。',
    Ds: '人工合成元素，以达姆施塔特命名。𫟼-281半衰期约14秒。',
    Rg: '人工合成元素，以伦琴命名。𬬭-282半衰期约100秒。',
    Cn: '人工合成元素，以哥白尼命名。鎶-285半衰期约30秒。',
    Nh: '人工合成元素，以日本（Nihon）命名。鉨-286半衰期约9.5秒。',
    Fl: '人工合成元素，以费廖罗夫命名。𫓧-289半衰期约2.1秒。',
    Mc: '人工合成元素，以莫斯科命名。镆-290半衰期约0.65秒。',
    Lv: '人工合成元素，以利弗莫尔命名。𫟷-293半衰期约53毫秒。',
    Ts: '人工合成元素，以田纳西州命名。鿬-294半衰期约78毫秒。',
    Og: '人工合成元素，以奥加涅相命名。气奥-294半衰期约0.69毫秒。'
  };

  function showDetail(container, elem){
    var detail = getEl('ptableDetail', container);
    if(!detail) return;

    var cat = CATEGORIES[elem.cat];
    var catCls = cat ? cat.cls : 'ptable-cat-other';
    var catLabel = cat ? cat.label : '其他';

    // 计算族
    var group = elem.col;
    var groupStr = group + ' 族';
    if(group <= 2) groupStr = group + ' 族' + (group === 1 ? ' (碱金属)' : ' (碱土金属)');
    else if(group >= 3 && group <= 12) groupStr = group + ' 族 (过渡金属)';

    // 电子排布
    var confDisplay = elem.conf ? elem.conf : '—';

    // 周期
    var periodStr = PERIOD_MAP[elem.row] || (elem.row + '');

    getEl('ptDetailSymbol', container).className = 'ptable-detail-symbol ' + catCls;
    getEl('ptDetailSymbol', container).textContent = elem.sym;
    getEl('ptDetailName', container).textContent = elem.cn;
    getEl('ptDetailSub', container).textContent = elem.en + ' (Z=' + elem.z + ')';

    var body = getEl('ptDetailBody', container);
    if(body){
      var desc = ELEM_DESC[elem.sym] || '';
      var descHtml = desc ? '<div class="ptable-detail-row ptable-detail-row-full ptable-detail-desc"><span class="ptable-detail-label">简介</span><span class="ptable-detail-value">' + desc + '</span></div>' : '';
      body.innerHTML =
        '<div class="ptable-detail-row"><span class="ptable-detail-label">原子序数</span><span class="ptable-detail-value">' + elem.z + '</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">分类</span><span class="ptable-detail-value">' + catLabel + '</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">周期</span><span class="ptable-detail-value">' + periodStr + '</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">族</span><span class="ptable-detail-value">' + groupStr + '</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">原子质量</span><span class="ptable-detail-value">' + elem.mass + ' u</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">电负性</span><span class="ptable-detail-value">' + elem.enPaul + '</span></div>' +
        '<div class="ptable-detail-row ptable-detail-row-full"><span class="ptable-detail-label">电子排布</span><span class="ptable-detail-value">' + confDisplay + '</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">熔点</span><span class="ptable-detail-value">' + elem.mpt + ' °C</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">沸点</span><span class="ptable-detail-value">' + elem.bpt + ' °C</span></div>' +
        '<div class="ptable-detail-row"><span class="ptable-detail-label">密度</span><span class="ptable-detail-value">' + elem.density + ' g/cm³</span></div>' +
        descHtml;
    }

    // 显示内容，隐藏占位
    var placeholder = getEl('ptDetailPlaceholder', container);
    var content = getEl('ptDetailContent', container);
    if(placeholder) placeholder.style.display = 'none';
    if(content) content.style.display = '';
  }

  function bindEvents(container){
    var searchInput = getEl('ptableSearch', container);
    if(searchInput){
      searchInput.addEventListener('input', function(){
        renderGrid(container, this.value.trim());
      });
    }

    var closeBtn = getEl('ptDetailClose', container);
    if(closeBtn){
      closeBtn.addEventListener('click', function(){
        var content = getEl('ptDetailContent', container);
        if(content){
          content.classList.add('closing');
          setTimeout(function(){
            var placeholder = getEl('ptDetailPlaceholder', container);
            if(placeholder) placeholder.style.display = '';
            content.style.display = 'none';
            content.classList.remove('closing');
          }, 200);
        }
      });
    }
  }

  function showDialog(){
    if(dialogEl) return;
    if(!WW.addons.periodicTable.htmlTemplate) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'modal-overlay';

    dialogEl = document.createElement('div');
    dialogEl.className = 'modal ptable-modal';
    dialogEl.innerHTML =
      '<div class="modal-head">' +
        '<span><i class="addon-icon addon-icon-ptable" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;"></i>元素周期表</span>' +
        '<button class="modal-close" id="ptableDialogClose"><i class="addon-icon addon-icon-close"></i></button>' +
      '</div>' +
      '<div class="modal-body addon-modal-body">' +
        WW.addons.periodicTable.htmlTemplate +
      '</div>';

    overlayEl.appendChild(dialogEl);
    document.body.appendChild(overlayEl);

    if(!styleEl || !styleEl.parentNode){
      styleEl = document.createElement('link');
      styleEl.rel = 'stylesheet';
      styleEl.href = '/addons/official/periodic-table/style.css';
      document.head.appendChild(styleEl);
    }

    requestAnimationFrame(function(){
      overlayEl.classList.add('show');
    });

    var closeBtn = getEl('ptableDialogClose');
    if(closeBtn){
      closeBtn.addEventListener('click', closeDialog);
    }

    overlayEl.addEventListener('click', function(e){
      if(e.target === overlayEl) closeDialog();
    });

    renderLegend(dialogEl);
    renderGrid(dialogEl, '');
    bindEvents(dialogEl);
  }

  function closeDialog(){
    if(overlayEl){
      overlayEl.classList.remove('show');
      setTimeout(function(){
        if(overlayEl && overlayEl.parentNode){
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        dialogEl = null;
      }, 300);
    }
    var btn = document.querySelector('.addon-activate-btn[data-addon-id="periodic-table"]');
    if(btn) btn.textContent = '装载';
  }

  // 注册
  Addons._handlers = Addons._handlers || {};
  Addons._handlers['periodic-table'] = {
    activate: function(){
      showDialog();
      var btn = document.querySelector('.addon-activate-btn[data-addon-id="periodic-table"]');
      if(btn) btn.textContent = '卸载';
    },
    close: function(){ closeDialog(); },
    isActive: function(){ return !!dialogEl; }
  };

  if(!Addons.activate){
    Addons.activate = function(addonId){
      if(Addons._handlers[addonId]) Addons._handlers[addonId].activate();
    };
  }
  if(!Addons.isActive){
    Addons.isActive = function(addonId){
      return Addons._handlers[addonId] && Addons._handlers[addonId].isActive ? Addons._handlers[addonId].isActive() : false;
    };
  }
  if(!Addons.close){
    Addons.close = function(){
      for(var key in Addons._handlers){
        if(Addons._handlers[key] && Addons._handlers[key].close) Addons._handlers[key].close();
      }
    };
  }
})();
