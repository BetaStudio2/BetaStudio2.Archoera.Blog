window.BINDER = window.BINDER || {};
window.BINDER.designscheme =
  '<h1>设计方案 — 基于铕配合物温敏荧光与参考通道校准的非接触式表面温度传感器</h1>' +

  '<h2>一、项目名称</h2>' +
  '<p>基于铕配合物温敏荧光与参考通道校准的非接触式表面温度传感器</p>' +

  '<h2>二、项目定位</h2>' +
  '<p>本项目不再以"紫外泄漏检测"为主线，而是转向"荧光温度传感器"的研究与实现。系统利用365 nm激发铕体系后产生613 nm附近红色荧光，研究荧光强度随温度变化的规律，并通过多通道光谱传感与参考通道校准实现表面温度的相对定量测量。</p>' +
  '<p>本项目强调三条主线同步展开：</p>' +
  '<ol>' +
    '<li>现代物理主线：光子能量、稀土离子离散能级、辐射与非辐射跃迁、半导体光电转换。</li>' +
    '<li>测量系统主线：荧光激发、温敏响应、多通道采集、标定拟合、误差分析。</li>' +
    '<li>应用主线：电子器件热点监测、加热台表面测温、教学演示型荧光温度传感平台。</li>' +
  '</ol>' +
  '<p>本项目的目标不是直接做论文级绝对高精度测温，而是完成一套具有现代物理内涵、可重复测量能力和应用展示价值的荧光温度传感系统。</p>' +

  '<h2>三、选题背景与意义</h2>' +
  '<p>传统温度测量多依赖热电偶、热敏电阻和红外测温仪。接触式温度计虽然成熟，但在微小区域、强电磁环境、透明封装结构或狭窄空间中的使用受到限制；红外测温虽能非接触测量，但对发射率、测量角度和表面状态较为敏感。</p>' +
  '<p>稀土荧光温度传感利用发光材料在不同温度下的荧光强度、寿命或强度比变化进行测温，具有非接触、响应快、抗电磁干扰、可用于微区测量等优势，是现代光学传感的重要方向。</p>' +
  '<div style="margin:20px 0;"><p style="margin:0 0 10px 0;font-weight:600;color:#8ab4f8;font-size:1.05em;">竞赛题目来源</p><img src="modules/platform/introduction/features/designscheme/data_1.0/image/0730607840289a392fc35f87cbe71132.png" style="max-width:100%;border-radius:6px;display:block;box-shadow:0 2px 8px rgba(0,0,0,0.3);" alt="竞赛题目：微弱电信号测量"/></div>' +
  '<p>结合现有条件，项目拟采用365 nm激发铕体系，在613 nm红光发射基础上研究其温敏荧光响应，并配合参考通道抑制激发波动影响，构建一套适合本科生实施的"非接触式荧光温度传感器"。</p>' +

  '<h2>四、核心科学问题</h2>' +
  '<p>本项目围绕以下四个问题展开：</p>' +
  '<ol>' +
    '<li>365 nm激发下，铕体系能否稳定产生足够强的613 nm附近红色荧光。</li>' +
    '<li>温度变化是否会引起荧光强度出现可重复、可标定的变化规律。</li>' +
    '<li>如何通过参考通道、遮光滤光和光谱分通道处理，区分温度效应与激发强度漂移带来的影响。</li>' +
    '<li>如何把"温敏荧光现象"做成"具有测量能力的温度传感器"，而不是停留在简单发光演示。</li>' +
  '</ol>' +

  '<h2>五、现代物理原理基础</h2>' +
  '<h3>1. 光子能量与激发过程</h3>' +
  '<p>激发光本质上由光子组成，单个光子的能量满足：</p>' +
  '<p style="text-align:center;font-style:italic;">E = hν = hc / λ</p>' +
  '<p>365 nm紫外光子具有较高能量，能够激发铕体系中的相关电子跃迁，从而诱导发光中心产生特征荧光。</p>' +
  '<h3>2. 稀土离子的离散能级跃迁</h3>' +
  '<p>铕离子Eu³⁺具有典型的离散4f电子能级结构。在外界光激发下，电子由低能级跃迁至高能级，随后通过辐射跃迁返回较低能级并发出特征红光。613 nm附近的红色发射通常可归因于Eu³⁺的⁵D₀到⁷F₂跃迁。</p>' +
  '<div style="margin:20px 0;"><p style="margin:0 0 10px 0;font-weight:600;color:#8ab4f8;font-size:1.05em;">铕元素资料</p><img src="modules/platform/introduction/features/designscheme/data_1.0/image/稀土资料.png" style="max-width:100%;border-radius:6px;display:block;box-shadow:0 2px 8px rgba(0,0,0,0.3);" alt="铕元素科普资料"/></div>' +
  '<h3>3. 温度对荧光的影响</h3>' +
  '<p>温度升高时，材料内部的晶格振动增强，无辐射跃迁概率上升，导致辐射发光效率下降，这一现象称为热猝灭。对于温敏荧光体系而言，随着温度变化，发射强度会按一定规律减弱或发生比例变化，从而为温度测量提供依据。</p>' +
  '<div style="margin:20px 0;"><p style="margin:0 0 10px 0;font-weight:600;color:#8ab4f8;font-size:1.05em;">实验材料：铕荧光粉末（365 nm 激发，613 nm 发射）</p><img src="modules/platform/introduction/features/designscheme/data_1.0/image/image.png" style="max-width:100%;border-radius:6px;display:block;box-shadow:0 2px 8px rgba(0,0,0,0.3);" alt="铕荧光粉末商品"/></div>' +
  '<h3>4. 半导体光电转换与数字光谱探测原理</h3>' +
  '<p>613 nm附近红色荧光照射到半导体传感器后，会在硅基光电二极管内部通过内光电效应产生光生载流子（电子-空穴对），光生电流与入射光子通量成正比。若采用普通光电二极管，输出的是模拟光电流，需要外部跨阻放大和模数转换；若采用AS7341这类多通道光谱传感器，芯片在不同波段的光电二极管阵列上方直接集成了纳米光学沉积干涉滤波膜（nano-optic deposited interference filter），将入射光按波长分开后分别进入对应通道，各通道独立完成光电流积分和片上模数转换（ADC），最终通过I²C接口输出数字计数值。这样既保留了"光电转换"的现代物理本质，又提高了系统的工程集成度和比赛展示效果。</p>' +

  '<h3>4.1 AS7341通道波长与Eu³⁺发射的匹配分析</h3>' +
  '<p>AS7341共有11个光学通道，其中8个可见通道（F1-F8）、1个近红外通道（NIR）、1个透明通道（Clear，无滤波，全波段响应）和1个闪烁检测通道（FD）。根据数据手册，可见通道的中心波长与半峰全宽（FWHM）如下表所示：</p>' +
  '<table style="border-collapse:collapse;width:100%;max-width:600px;margin:10px 0;">' +
    '<tr style="background:#1e2632;"><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">通道</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">中心波长</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">FWHM</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">覆盖范围</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F1</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">415 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">26 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~402–428 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F2</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">445 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">30 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~430–460 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F3</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">480 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">36 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~462–498 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F4</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">515 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">39 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~496–535 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F5</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">555 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">39 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~536–575 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F6</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">590 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">40 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~570–610 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F7</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">630 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">50 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~605–655 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">F8</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">680 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">52 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">~654–706 nm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">NIR</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">910 nm</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">—</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">近红外</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">Clear</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">无滤波</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">—</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">全波段（~350–1000 nm）</td></tr>' +
  '</table>' +
  '<p>Eu³⁺在613 nm附近的⁵D₀→⁷F₂特征红色发射峰，恰好落入F7通道的覆盖范围（605–655 nm），且F7通道的中心波长（630 nm）与613 nm发射峰距离较近。因此F7通道是本项目最核心的荧光信号采集通道。邻近的F6通道（570–610 nm）覆盖了激发光散射的短波尾部和部分荧光短波成分，可作为短波背景参考；F8通道（654–706 nm）覆盖长波背景，可作为长波背景参考。Clear通道则提供无滤波的总光强信息，用于归一化激发波动。</p>' +

  '<h3>4.2 纳米光学干涉滤波的物理原理</h3>' +
  '<p>AS7341的通道选择性并非依赖外部滤光片，而是通过在标准CMOS硅片表面直接沉积多层介质薄膜形成法布里-珀罗（Fabry-Pérot）干涉结构。每一层介质膜的厚度和折射率经过精确设计，使得特定波长范围的光在多层膜中发生相长干涉（constructive interference）而透过，其他波长发生相消干涉（destructive interference）而被抑制。这种片上集成滤波技术使得每个像素本身就是一个微型光谱通道，无需传统的光栅分光或棱镜分光结构，大幅缩小了传感器体积（封装仅3.1 mm × 2.0 mm × 1.0 mm）。</p>' +

  '<h3>4.3 并行ADC架构与多通道同步采集</h3>' +
  '<p>AS7341内部集成6个并行ADC（analog-to-digital converter），可同时对6个通道进行积分和模数转换。这意味着在一次积分周期内，可以同步获取F6、F7、F8、Clear、NIR和F5等6个通道的数据，而不需要分时轮询。并行采集保证了各通道数据对应同一时刻的荧光状态，这对于后续的归一化处理和温度反演至关重要——因为荧光强度和激发波动随时间都在变化，分时采集会引入通道间的时间错位误差。</p>' +

  '<h3>5. 本项目的完整物理链条</h3>' +
  '<p>本系统的核心物理过程可概括为：</p>' +
  '<p style="text-align:center;font-weight:600;">365 nm激发光入射 → 铕体系吸收光子能量 → Eu³⁺发生离散能级跃迁 → 发出613 nm附近红色荧光 → 温度变化引起荧光热猝灭 → 荧光被多通道光谱传感器或光电探测器采集 → 通过标定关系反推出温度</p>' +

  '<h2>六、总体设计思想</h2>' +
  '<p>本项目采用"温敏荧光主通道 + 参考通道"的设计思想：</p>' +
  '<ol>' +
    '<li>温敏主通道负责采集样品613 nm附近红色荧光对应的光谱信号。</li>' +
    '<li>参考通道负责监测激发光强、透明通道基准信号或相邻波段背景，用于抵消激发源波动和器件漂移的影响。</li>' +
    '<li>通过建立归一化响应量R，增强单发射峰方案的稳定性：<br/>R = (S_fluo - S_dark) / (S_ref - S_ref,dark)<br/>其中S_fluo为荧光主通道输出，S_ref为参考通道输出。若采用AS7341，S_fluo可取630 nm邻近通道计数，S_ref可取透明通道或激发参考通道计数。</li>' +
    '<li>通过恒温台或加热台完成标定实验，获得R与T的关系曲线。</li>' +
    '<li>通过实际物体表面测量展示传感器应用价值。</li>' +
  '</ol>' +
  '<p>该方案虽然不是严格意义上的双发射峰荧光强度比测温，但属于具有自校准能力的荧光温度传感系统。若引入AS7341，可在不搭建复杂模拟跨阻电路的前提下实现简化光谱分辨和数字采集，更适合目前条件。</p>' +

  '<h2>七、系统总体方案</h2>' +
  '<p>系统由七个模块组成：</p>' +
  '<p><strong>1. 激发模块</strong> — 主激发源：365 nm激光笔；对照光源：400 nm激光笔。用于激发温敏荧光，并通过对照实验验证365 nm更适合激发铕体系。</p>' +
  '<p><strong>2. 温敏荧光探头模块</strong> — 候选材料：铕荧光粉末、铕金属有机配合物粉末、铕盐溶液或后续固化封装后的铕配合物薄膜。初期形式：粉末样品池、石英比色皿或密封透明小槽。升级形式：树脂封装薄膜或贴附式探头。作用：将温度变化转化为荧光强度变化。</p>' +
  '<p><strong>3. 温控与标定模块</strong> — 热台、电热板、恒温台或加热片；接触式参考温度计：热电偶、DS18B20或数字温度计。作用：给出真实温度值，用于建立荧光响应与温度的标定关系。</p>' +
  '<p><strong>4. 光学约束模块</strong> — 遮光暗箱、激发入射孔、红色滤光片或长波通滤光片、样品固定支架。作用：抑制环境光和激发漏光，提高荧光探测真实性。</p>' +
  '<p><strong>5. 光谱探测模块</strong> — 优先方案：AS7341多通道光谱颜色传感器；备选方案：荧光探测光电二极管 + 参考通道光电二极管；可调探测支架。作用：获取613 nm附近红光对应的数字光谱信号，并同步采集参考通道。</p>' +
  '<p><strong>6. 信号采集与处理模块</strong> — I²C数字采集、通道积分时间设置与平均滤波、背景扣除与归一化计算、单片机或上位机数据记录。作用：将多通道光谱计数稳定转换为可用于测温拟合的响应量。</p>' +
  '<p><strong>7. 显示与软件处理模块</strong> — 基础版：电脑串口/Excel拟合；升级版：单片机采集 + OLED显示 + 实时温度换算。作用：实现温度显示、曲线拟合和数据记录。</p>' +

  '<h2>八、传感探头与样品结构设计</h2>' +
  '<p>本项目建议分"验证版"和"展示版"两种探头形式。</p>' +
  '<h3>1. 验证版探头</h3>' +
  '<p>将铕荧光粉末装入浅样品槽，或将铕盐溶液装入石英比色皿、小型透明密封槽中，放置在受控加热平台上。该结构便于快速验证发光强度是否随温度稳定变化，是前期最适合的实验形式。</p>' +
  '<h3>2. 展示版探头</h3>' +
  '<p>将铕体系固化在透明树脂或聚合物薄膜中，贴附于待测物表面。激发光与探测器都位于外部，从而形成"非接触读取、贴附式测温"的展示结构。</p>' +
  '<h3>3. 结构要求</h3>' +
  '<ul>' +
    '<li>样品必须密封，避免二氯甲烷挥发影响浓度和安全性；</li>' +
    '<li>样品厚度尽量均一，避免光程变化带来额外误差；</li>' +
    '<li>探测窗口与激发窗口尽量分离，避免直射漏光进入探测器；</li>' +
    '<li>如采用薄膜形式，应优先考虑透明、耐热、低荧光背景的封装材料。</li>' +
  '</ul>' +
  '<h3>4. 传感器热隔离要求</h3>' +
  '<p>AS7341芯片的工作温度范围为-30 ℃到70 ℃（数据手册规定），而标定实验的加热台可能达到80 ℃以上。因此AS7341模块不能与加热台紧密接触或置于同一密闭热腔中，必须采取热隔离措施：</p>' +
  '<ul>' +
    '<li>AS7341模块应安装在暗箱侧壁或外部，通过光学窗口接收荧光，利用空气间隙实现热隔离；</li>' +
    '<li>若暗箱体积较小导致内部温度随加热台升高，可在暗箱侧壁加装散热孔或小型风扇促进空气对流；</li>' +
    '<li>可在AS7341模块与暗箱内壁之间加入隔热垫片（如聚四氟乙烯薄片），进一步降低热传导；</li>' +
    '<li>实验过程中应使用独立温度计监测AS7341模块附近的环境温度，确保不超过60 ℃。</li>' +
  '</ul>' +

  '<h2>九、核心探测与电路设计</h2>' +

  '<h3>1. AS7341芯片基本参数</h3>' +
  '<p>AS7341是艾迈斯欧司朗（ams OSRAM）推出的11通道多光谱数字传感器。</p>' +
  '<table style="border-collapse:collapse;width:100%;max-width:600px;margin:10px 0;">' +
    '<tr style="background:#1e2632;"><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">参数</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">规格</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">封装</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">OLGA-8，尺寸3.1 mm × 2.0 mm × 1.0 mm</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">供电电压</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">1.7 V – 2.0 V（典型值1.8 V）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">工作温度范围</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">-30 ℃ – 70 ℃</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">有源模式功耗</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">典型210 μA，最大300 μA（VDD=1.8 V）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">休眠模式功耗</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">典型0.7 μA，最大5 μA</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">I²C接口</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">支持400 kHz快速模式，7-bit地址0x39</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">通道架构</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">8个可见光（F1-F8）+ NIR + Clear + FD</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">ADC</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">6个并行ADC，可同时采集6个通道</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">增益范围</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0.5× 至 512×，可编程设置</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">积分时间</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">约2.78 ms 至数秒，由ATIME寄存器控制</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">GPIO</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">可配置为外部触发输入、光源同步输出或外部光电二极管输入</td></tr>' +
  '</table>' +

  '<h3>2. 荧光主通道与参考通道的确定</h3>' +
  '<p>根据AS7341通道波长分布，制定以下通道分配方案：</p>' +
  '<p><strong>2.1 荧光主通道：F7（中心630 nm，FWHM 50 nm）</strong> — Eu³⁺的⁵D₀→⁷F₂特征发射位于613 nm，落在F7通道的覆盖范围（605–655 nm）内。F7通道是本项目的核心信号通道，用于采集温度敏感的荧光强度。</p>' +
  '<p><strong>2.2 短波背景参考通道：F6（中心590 nm，FWHM 40 nm）</strong> — F6覆盖570–610 nm，位于613 nm发射峰的短波侧。该通道可用于监测激发光（365 nm）在样品上的散射泄漏，以及滤光片未能完全阻挡的短波杂散光。当F6计数异常升高时，说明遮光或滤光效果不佳。</p>' +
  '<p><strong>2.3 长波背景参考通道：F8（中心680 nm，FWHM 52 nm）</strong> — F8覆盖654–706 nm，位于613 nm发射峰的长波侧，理论上不应有Eu³⁺的强荧光信号。若F8出现异常高计数，提示存在环境光源干扰或热辐射背景。</p>' +
  '<p><strong>2.4 总光强参考通道：Clear（无滤波）</strong> — Clear通道覆盖约350–1000 nm全波段，无滤波衰减。该通道用于表征总入射光强并作为归一化参考，以抵消激发源功率波动对荧光信号的影响。但需注意Clear通道灵敏度高、容易饱和，实际使用时可能需要较低的增益设置。</p>' +
  '<p><strong>2.5 辅助验证通道：F5（中心555 nm，FWHM 39 nm）和NIR（中心910 nm）</strong> — F5位于绿-黄光波段，远离613 nm，可作为远离荧光的空白背景参考。NIR通道可用于检测加热台在高温下可能产生的近红外热辐射，帮助区分热辐射干扰与荧光信号。</p>' +

  '<h3>3. 归一化响应量的多通道形式</h3>' +
  '<p>基于上述通道分配，归一化响应量R可采用以下几种形式进行对比实验，选择稳定性和灵敏度最优的方案：</p>' +
  '<p><strong>方案A（基础单参考）：</strong>R_A = (S_F7 - S_F7,dark) / (S_Clear - S_Clear,dark)</p>' +
  '<p><strong>方案B（双背景扣除）：</strong>R_B = (S_F7 - S_F7,dark) / [S_Clear - S_Clear,dark]，其中S_F7在数据处理前先减去相邻背景均值：(S_F6 + S_F8) / 2</p>' +
  '<p><strong>方案C（比值参考）：</strong>R_C = (S_F7 - S_F7,dark) / (S_F6 - S_F6,dark)</p>' +
  '<p>初期建议同时计算三种R并比较，选择R-T线性度最佳、重复性最好的方案作为最终标定模型。</p>' +

  '<h3>4. I²C通信与寄存器配置</h3>' +
  '<p><strong>4.1 I²C总线连接</strong> — AS7341通过I²C接口与单片机通信，仅需4根线（VDD、GND、SCL、SDA），外加可选的中断信号线INT。如使用5 V或3.3 V单片机（如Arduino Uno/Nano、STM32），需确认AS7341模块已板载电平转换电路，否则需要外加电平转换器将I²C总线电压降至1.8 V。</p>' +
  '<p><strong>4.2 关键寄存器</strong> — 以下是本项目中需要操作的核心寄存器：</p>' +
  '<table style="border-collapse:collapse;width:100%;max-width:550px;margin:10px 0;">' +
    '<tr style="background:#1e2632;"><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">寄存器名称</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">地址</td><td style="padding:8px 12px;border:1px solid #3b3b3b;font-weight:600;color:#e8edf7;">功能描述</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">ENABLE</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0x80</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">使能控制（bit0: PON上电, bit1: SP_EN光谱测量使能）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">ATIME</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0x81</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">积分时间设置，T_int = (ATIME+1) × 2.78 ms</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">WTIME</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0x83</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">等待时间设置（两次积分之间的间隔）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">CFG0</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0xA9</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">增益设置（AGAIN，0:×0.5 到 10:×512）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">CFG1</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0xAA</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">积分模式与数据就绪行为</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">ASTATUS</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0x94</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">状态寄存器（bit7: 数据就绪, bit3: 闪烁检测）</td></tr>' +
    '<tr><td style="padding:8px 12px;border:1px solid #3b3b3b;">CH0_DATA_L/H</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">0x95–0xA6</td><td style="padding:8px 12px;border:1px solid #3b3b3b;">CH0–CH5数据寄存器（共6对12字节）</td></tr>' +
  '</table>' +
  '<p><strong>4.3 SMUX通道映射</strong> — AS7341有6个并行ADC（CH0-CH5），需要通过SMUX（Spectral MUX）寄存器将光学通道映射到ADC通道。建议的并行采集映射为：CH0←F6、CH1←F7、CH2←F8、CH3←Clear、CH4←F5、CH5←NIR。该映射可一次积分同时获取全部6个相关通道的数据。</p>' +

  '<h3>5. 采集流程与软件设计</h3>' +
  '<p>推荐的数据采集流程如下：</p>' +
  '<ol>' +
    '<li>上电初始化：设置ENABLE寄存器PON=1，等待芯片稳定；</li>' +
    '<li>配置SMUX：将所需光学通道映射到CH0-CH5；</li>' +
    '<li>设置增益CFG0（AGAIN）：根据荧光强度预实验选择合适的增益值，建议从×64开始试探；</li>' +
    '<li>设置积分时间ATIME：使F7通道计数在量程的30%–80%之间，避免饱和和欠曝；</li>' +
    '<li>使能光谱测量SP_EN=1，开始积分；</li>' +
    '<li>轮询ASTATUS寄存器bit7（数据就绪标志），或使用INT引脚中断；</li>' +
    '<li>数据就绪后依次读取CH0_DATA_L/H到CH5_DATA_L/H共12字节；</li>' +
    '<li>重复N次取平均（如N=10），输出平均值作为当前温度点数据；</li>' +
    '<li>同步记录暗背景（遮住传感器窗口时各通道读数）用于扣除。</li>' +
  '</ol>' +

  '<h3>6. 积分时间与增益的优化策略</h3>' +
  '<ul>' +
    '<li>室温下（荧光最强时），F7读数应控制在量程的60%–80%，以此为基准设置积分时间；</li>' +
    '<li>高温下荧光减弱，可能需要延长积分时间或提高增益来维持足够的信噪比；</li>' +
    '<li>Clear通道由于无滤波衰减，在相同增益和积分时间下读数远高于F7，可能需要将Clear通道映射到不同增益组，或通过SMUX将Clear分配到不同的ADC配置；</li>' +
    '<li>建议在软件中实现自动增益调整：若F7读数低于量程的20%，自动提高一级增益。</li>' +
  '</ul>' +

  '<h3>7. 单片机的选择建议</h3>' +
  '<ul>' +
    '<li>Arduino Uno/Nano：I²C库成熟（Wire库），开发难度最低，但5 V逻辑需确认模块电平兼容；</li>' +
    '<li>ESP32：WiFi/蓝牙可选，I²C支持良好，3.3 V逻辑更接近1.8 V（仍需电平转换），适合需要无线传输数据的场景；</li>' +
    '<li>STM32（如STM32F103C8T6）：3.3 V逻辑，I²C外设完善，可配合OLED显示屏实时显示温度，适合展示版开发；</li>' +
    '<li>推荐入门方案：先使用Arduino + 串口输出到PC进行标定实验（基础版），再迁移到STM32 + OLED进行展示（升级版）。</li>' +
  '</ul>' +

  '<h3>8. 模拟探测备选方案</h3>' +
  '<p>若后续无法稳定采购或驱动AS7341，也可退回"红色滤光片（如600 nm长波通滤光片）+ 光电二极管 + 跨阻放大器"的模拟方案。在模拟方案中，荧光通道使用带红色滤光片的光电二极管，参考通道使用未加滤光片的光电二极管或直接监测激光管驱动电流。该方案探测器成本更低、电路更直观，但光谱分辨能力和展示效果不如AS7341方案。</p>' +

  '<h3>9. 标定与换算单元</h3>' +
  '<p>通过将归一化响应R与参考温度T进行拟合，可得到经验关系：</p>' +
  '<p style="text-align:center;">T = a + bR + cR² 或 ln R = A + B / T</p>' +
  '<p>最终由单片机或上位机实现温度换算。</p>' +

  '<h2>十、实验设计</h2>' +
  '<h3>1. 激发波长筛选实验</h3>' +
  '<p>目的：比较365 nm和400 nm对铕体系的激发效果，确定主激发源。固定样品、探测器和环境条件；分别使用365 nm和400 nm激发；记录荧光亮度以及AS7341各通道输出或探测电压；选择荧光更强、稳定性更好的激发波长。意义：验证"波长不同 → 光子能量不同 → 激发效率不同"的现代物理规律。</p>' +

  '<h3>2. 温度标定实验</h3>' +
  '<p>目的：建立荧光响应与温度之间的对应关系。将样品置于加热平台上；使用热电偶或数字温度计记录实际温度；按照固定温度间隔升温（如25 ℃到80 ℃）；在每个温度点记录荧光主通道、参考通道及暗背景输出；计算归一化响应R，绘制R-T曲线并拟合。意义：这是整个温度传感器能否成立的核心实验。</p>' +

  '<h3>3. 升温与降温回线实验</h3>' +
  '<p>目的：考察系统是否存在滞后现象。按标定步骤逐级升温；再逐级降温；比较同一温度点下升温与降温的输出差异。意义：用于评价传感器的可逆性与重复性。</p>' +

  '<h3>4. 响应时间实验</h3>' +
  '<p>目的：测量样品对温度突变的响应速度。将样品从室温迅速移至加热台；记录输出电压或归一化响应随时间变化曲线；取达到最终稳定值90%所需时间作为响应时间。意义：体现荧光温度传感器的动态性能。</p>' +

  '<h3>5. 重复性和稳定性实验</h3>' +
  '<p>目的：评价系统是否具有重复测量能力。同一温度点重复测量多次；分析平均值、标准差和相对波动；观察长时间照射下是否出现光漂白或漂移。</p>' +

  '<h3>6. 应用验证实验</h3>' +
  '<p>目的：展示传感器不是"只会测标定台"，而是能够测真实物体表面温度。推荐对象：加热台表面温度分布、功率电阻表面温升、小型电路模块热点、电池壳体表面温升。</p>' +

  '<h3>7. 空白与干扰对照实验</h3>' +
  '<p>目的：区分真实温敏荧光信号与杂散光、激发波动带来的假信号。步骤：无样品背景测试；有样品但不加滤光片测试；加参考通道与不加参考通道对比；遮光前后对比。</p>' +

  '<h2>十一、数据处理与温度反演方法</h2>' +
  '<h3>1. 原始采集量</h3>' +
  '<p>若采用AS7341，原始采集量可记为S_fluo、S_ref、S_dark；若采用模拟方案，则对应荧光通道电压Vf、参考通道电压Vref以及暗背景Vdark。</p>' +
  '<h3>2. 归一化处理</h3>' +
  '<p>采用归一化响应量R削弱激发源波动和器件增益漂移带来的影响：R = (S_fluo - S_dark) / (S_ref - S_ref,dark)。若使用AS7341，还可进一步比较红光邻近通道与透明通道、相邻可见通道之间的组合关系，以削弱背景漏光影响。</p>' +
  '<h3>3. 标定拟合</h3>' +
  '<p>依据实验结果选择合适的拟合模型：线性模型 R = a + bT；指数模型 R = A exp(-BT)；多项式模型 R = a + bT + cT²。</p>' +
  '<h3>4. 灵敏度分析</h3>' +
  '<p>可定义相对灵敏度：S = |(1/R) dR/dT|，用于比较不同温区下的测温灵敏程度。</p>' +
  '<h3>5. 误差评估</h3>' +
  '<p>可计算最大绝对误差、平均相对误差与重复性误差，并分析主要误差来源。</p>' +

  '<h2>十二、应用场景</h2>' +
  '<ol>' +
    '<li>电子器件热点监测：将温敏荧光探头贴附于电阻、电源模块或芯片散热片表面，可实现非接触读取的局部温升监测。</li>' +
    '<li>小型热系统表面测温：用于加热片、热台、加热棒附近的表面温度测量和演示。</li>' +
    '<li>透明封装或狭小空间测温：相比热电偶，荧光探头可以做得更薄、更轻，更适合放在狭小位置。</li>' +
    '<li>现代物理与光电实验教学：该系统可直观展示"光激发 → 荧光发射 → 温敏变化 → 光电转换 → 数据处理"的完整链条，适合作为现代物理综合实验。</li>' +
  '</ol>' +

  '<h2>十三、创新点</h2>' +
  '<ol>' +
    '<li><strong>原理创新：</strong>将铕体系的离散能级跃迁、热猝灭效应和半导体光电转换串联起来，构成完整的荧光温度传感链路。</li>' +
    '<li><strong>方法创新：</strong>在单发射峰温敏荧光基础上引入参考通道校准，并使用AS7341实现简化多通道光谱采集，提高单峰方案的稳定性和可信度。</li>' +
    '<li><strong>系统创新：</strong>把激发、测温、参考校准、光谱采集、温度换算和应用展示整合为一体。</li>' +
    '<li><strong>工程创新：</strong>方案支持从"密封比色皿验证版"升级到"贴附式薄膜展示版"，便于比赛现场展示项目演进过程。</li>' +
    '<li><strong>现代物理特色：</strong>项目既包含量子跃迁、光谱发射和热猝灭机理，又包含光电探测和数据建模，体现近代物理与工程实现的结合。</li>' +
  '</ol>' +

  '<h2>十四、预期成果</h2>' +
  '<ol>' +
    '<li>一套铕体系温敏荧光温度传感样机；</li>' +
    '<li>一套包含激发、滤光、多通道探测和信号处理的完整实验平台；</li>' +
    '<li>365 nm与400 nm激发效果对比数据；</li>' +
    '<li>温度标定曲线与拟合模型；</li>' +
    '<li>升温降温回线、重复性和响应时间测试结果；</li>' +
    '<li>典型物体表面测温演示结果；</li>' +
    '<li>可用于答辩的原理图、结构图、实验照片和演示视频。</li>' +
  '</ol>' +

  '<h2>十五、可行性分析</h2>' +
  '<ol>' +
    '<li><strong>现有条件具备切入基础：</strong>目前已经有365 nm和400 nm激光笔，并已获取铕体系在365 nm激发下613 nm附近红光发射的信息，具备前期验证条件。</li>' +
    '<li><strong>实现路线清晰：</strong>项目可按照"先验证温敏发光，再搭建双通道检测，再做标定实验，最后进行应用展示"的顺序逐步推进。</li>' +
    '<li><strong>成本总体可控：</strong>新增器件主要为石英比色皿或粉末样品槽、AS7341模块或光电二极管方案、红色滤光片、加热模块、参考温度计和单片机，整体成本适中。</li>' +
    '<li><strong>展示效果较好：</strong>项目既有肉眼可见的红色荧光，又有实时温度读数和标定曲线，现场答辩展示比纯材料论文更直观。</li>' +
  '</ol>' +

  '<h2>十六、风险与应对措施</h2>' +
  '<p><strong>风险1：铕体系荧光随温度变化不明显</strong> — 应对：先做25 ℃到80 ℃范围的预实验；比较总强度和归一化响应哪个变化更明显；必要时缩小目标温区，提高分辨率。</p>' +
  '<p><strong>风险2：单峰强度法易受激发波动影响</strong> — 应对：增加参考通道；稳定激发几何结构；使用归一化响应而不是单独强度。</p>' +
  '<p><strong>风险3：二氯甲烷挥发导致样品不稳定</strong> — 应对：采用密封石英容器；避免开放式样品；后续改为固化封装薄膜。</p>' +
  '<p><strong>风险4：探测器测到的是漏光而不是荧光</strong> — 应对：采用正交探测结构；在荧光通道前加入红色滤光片；做空白和滤光对照实验。</p>' +
  '<p><strong>风险5：AS7341通道较宽，不能像专业光谱仪那样精确分峰</strong> — 应对：本项目明确定位为相对测温与趋势分析，不夸大为高分辨率光谱仪；重点使用F7通道（FWHM 50 nm）采集613 nm荧光，F6和F8作为背景参考。</p>' +
  '<p><strong>风险6：AS7341工作温度上限为70 ℃，而标定实验加热台可能达到80 ℃以上</strong> — 应对：AS7341模块必须与加热台保持空间隔离；标定温度上限建议定为65 ℃；使用独立温度计实时监测模块温度。</p>' +
  '<p><strong>风险7：Clear通道无滤波、灵敏度高，在强荧光或激发泄漏场景下容易饱和溢出</strong> — 应对：Clear通道使用较低的增益设置（如×2或更低）；可考虑在Clear通道前方单独增加中性密度滤光片（ND filter）衰减光强；或改用F6通道作为归一化参考通道。</p>' +
  '<p><strong>风险8：F7通道的50 nm带宽包含了除613 nm荧光外的背景光，导致温度响应灵敏度被稀释</strong> — 应对：在探测器窗口前方增加600 nm长波通滤光片；利用F6和F8通道的输出构造宽带背景估计，在数据处理中从F7读数中扣除。</p>' +
  '<p><strong>风险9：项目显得过于简单</strong> — 应对：增加双通道校准；增加升温降温回线、响应时间和应用验证实验；强调现代物理原理与工程实现的统一。</p>' +

  '<h2>十七、实施步骤</h2>' +
  '<p><strong>第一阶段：材料与发光验证</strong> — 验证365 nm激发下是否有稳定红光；对比365 nm与400 nm激发效果；确定样品容器和封装方式。</p>' +
  '<p><strong>第二阶段：温敏预实验</strong> — 搭建简易加热平台；记录不同温度下的荧光变化；判断温敏规律是否可用。</p>' +
  '<p><strong>第三阶段：光路与探测结构搭建</strong> — 完成遮光暗箱设计；完成荧光通道与参考通道布局；加入滤光片与样品支架。</p>' +
  '<p><strong>第四阶段：电路搭建</strong> — 完成AS7341与单片机通信；完成主通道、参考通道和暗背景采集；输出稳定数字信号或保留模拟备选方案。</p>' +
  '<p><strong>第五阶段：温度标定与模型建立</strong> — 完成多温度点标定；获取R-T曲线；进行拟合与误差分析。</p>' +
  '<p><strong>第六阶段：应用验证与展示优化</strong> — 完成典型物体表面测温；加入温度实时显示功能；制作海报、PPT和答辩材料。</p>' +

  '<h2>十八、答辩表述建议</h2>' +
  '<p>答辩时建议采用以下逻辑：</p>' +
  '<ol>' +
    '<li>传统接触式和红外测温在某些场景下存在局限；</li>' +
    '<li>稀土荧光温度传感是一种具有现代物理内涵的非接触测温方法；</li>' +
    '<li>我们利用365 nm激发铕体系产生613 nm附近红色荧光；</li>' +
    '<li>温度变化会改变辐射与非辐射跃迁竞争关系，导致荧光强度出现可测变化；</li>' +
    '<li>我们通过AS7341多通道光谱采集与参考通道校准，实现了表面温度的相对定量测量；</li>' +
    '<li>最终构建出一套兼具物理原理、工程实现和应用展示价值的荧光温度传感器。</li>' +
  '</ol>' +

  '<h2>十九、项目最终定位</h2>' +
  '<p>本项目最终应定位为：<strong>"基于铕体系温敏荧光与参考通道校准的非接触式表面温度传感器"</strong>，而不是"一个会发红光的小实验"。前者体现的是现代物理原理、测量系统设计、实验研究能力和实际应用价值的统一，后者则容易显得浅显。</p>' +

  '<h2>二十、中文参考文献</h2>' +
  '<ol>' +
    '<li>郑玉华. 基于稀土发光材料荧光强度比技术的光学温度传感研究进展[J]. — 可作为本项目现代物理背景、荧光测温机理和研究现状的核心综述参考。</li>' +
    '<li>吴中立，吴红梅，唐立丹，等. Tm³⁺/Yb³⁺共掺氟氧化物碲酸盐玻璃的上转换发光及光学温度传感[J]. 光子学报，2017，46(9): 0916003. — 可用于说明稀土荧光强度比测温、热耦合能级和灵敏度分析。</li>' +
    '<li>彭跃红，任韦舟，邱建备，等. 1550 nm激发层状BiOCl:Er³⁺上转换发光及温度传感特性[J]. 无机材料学报，2020，35(8): 902-908. — 可用于说明稀土发光体系中非热耦合能级测温。</li>' +
    '<li>程同蕾，尹智远，刘伟，等. 稀土离子掺杂碲酸盐上转换发光玻璃及光纤的荧光传感应用[J]. 激光与光电子学进展，2022，59(15): 1516017. — 综述类文献，支撑稀土发光材料在温度传感领域应用背景。</li>' +
    '<li>牛家麒，张瑞，张卓奇，等. 多参数激光告警中光功率测量电路设计[J]. 激光杂志，2024，45(9). — 支撑光电二极管、跨阻放大、A/D采集和标定测量模块的电路设计。</li>' +
    '<li>李翔，史忠祥，王晶，等. Er³⁺、Eu³⁺双掺杂LaOF荧光粉的光学性能研究及防伪应用[J]. 光电子·激光，2024，35(6). — 说明365 nm激发下稀土荧光粉可产生稳定可见发光。</li>' +
    '<li>胡欣妍，曹龙菲，李金华，等. Eu³⁺/Dy³⁺共掺Sr₃Y₂(BO₃)₄荧光粉的发光性质研究[J]. 光谱学与光谱分析，2022，42(7): 2063-2068. — 说明Eu³⁺在593 nm和613 nm附近的典型橙红与红色发射特征。</li>' +
    '<li>唐菀涓，郭庆丰，苏科，等. 白磷钙石型荧光粉Ca₁.₈Li₀.₆La₀.₆₋ₓ(PO₄)₂:xEu³⁺的合成、结构及发光性能[J]. 人工晶体学报，2021，50(11): 2081-2085. — 支撑Eu³⁺的⁵D₀到⁷F₂跃迁与617 nm附近红光发射机理。</li>' +
    '<li>邵可满，傅桂瑜，陈素艳，等. 稀土配合物分子印迹荧光探针的制备及检测孔雀石绿的残留[J]. 光谱学与光谱分析，2022，42(3): 808-813. — 说明稀土配合物在荧光探针和分析检测中的应用方式。</li>' +
    '<li>艾迈斯欧司朗. AS7341 11通道光谱颜色传感器产品资料[EB/OL]. — 支撑本项目中多通道光谱采集、I²C数字读出、透明通道参考校准等工程实现内容。</li>' +
    '<li>若后续能获得具备双发射峰的稀土温敏材料，可进一步将本项目升级为"荧光强度比FIR温度传感器"，提高测量稳定性和比赛层次。</li>' +
  '</ol>';
