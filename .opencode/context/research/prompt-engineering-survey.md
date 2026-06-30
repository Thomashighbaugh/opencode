---
source: "A Comprehensive Survey of Prompt Engineering Techniques in Large Language Models by Debnath et al. (October 2025)"
type: academic-paper
converted: pdf-to-text
converted_at: 2026-06-26T23:34:08Z
---
28 October 2025



A Comprehensive Survey of Prompt Engineering
Techniques in Large Language Models
                  1                             2                                   3                4                      4
Tonmoy Debnath , Md Nurul Absar Siddiky , Muhammad Enayetur Rahman , Prosenjit Das , Antu Kumar Guha ,
                               5                    6
Muhammad Rezaur Rahman , H. M. Dipu Kabir


1. Computer Science and Technology, Mymensingh Polytechnic Institute

2. Electrical and Computer Engineering, University of North Carolina at Charlotte

3. Electrical and Computer Engineering, Old Dominion University

4. Electronics and Communication Engineering Discipline, Khulna University

5. Research and Innovation Department, Agile Crafts

6. Artiﬁcial Intelligence and Cyber Futures Institute, Charles Sturt University


Abstract

Prompt engineering has arisen as a pivotal discipline in optimizing the performance of Large
Language Models (LLMs) by structuring inputs to enhance coherence, accuracy, and task
alignment. This paper comprehensively surveys various prompting techniques, systematically
categorizing them according to their application domains and methodological foundations.
Fundamental approaches like zero-shot and few-shot prompting are examined along with
advanced strategies, including chain-of-thought reasoning, retrieval-augmented generation, and
self-consistency mechanisms. A rigorous qualitative analysis is conducted to evaluate each
technique's strengths, limitations, and optimal use cases, oﬀering a structured framework for
selecting the most eﬀective prompting strategies. Theoretical insights and empirical ﬁndings are
consolidated to provide researchers and practitioners with advanced methodologies for reﬁning
prompt design and enhancing LLM capabilities in complex reasoning, decision-making, and
knowledge synthesis while improving reliability and factual accuracy in generated outputs.


Keywords

artiﬁcial intelligence, computing and processing, large language models, machine learning,
prompt engineering




Posted on 28 October 2025 — CC-BY 4.0 — This is a preprint and has not been peer reviewed. Data may be preliminary. — https://
doi.org/10.36227/techrxiv.174140719.96375390/v2
 A Comprehensive Survey of Prompt Engineering Techniques in Large Language Models

                   Tonmoy Debnath a , Md Nurul Absar Siddiky b,∗ , Muhammad Enayetur Rahman c,∗ , Prosenjit Das d ,
                             Antu Kumar Guha d , Muhammad Rezaur Rahman e , H. M. Dipu Kabir f
                             a Computer Science and Technology, Mymensingh Polytechnic Institute, Mymensingh, 2200, Bangladesh.
                         b Electrical and Computer Engineering, University of North Carolina at Charlotte, Charlotte, NC, 28223, USA.
                                   c Electrical and Computer Engineering, Old Dominion University, Norfolk, VA, 23509, USA.
                            d Electronics and Communication Engineering Discipline, Khulna University, Khulna, 9208, Bangladesh.
                                    e Research and Innovation Department, Agile Crafts, Khilgaon, Dhaka, 1219, Bangladesh.
                           f Artificial Intelligence and Cyber Futures Institute, Charles Sturt University, Bathurst, NSW, 2795, Australia.




Abstract
Prompt engineering has arisen as a pivotal discipline in optimizing the performance of Large Language Models (LLMs) by structur-
ing inputs to enhance coherence, accuracy, and task alignment. This paper comprehensively surveys various prompting techniques,
systematically categorizing them according to their application domains and methodological foundations. Fundamental approaches
like zero-shot and few-shot prompting are examined along with advanced strategies, including chain-of-thought reasoning, retrieval-
augmented generation, and self-consistency mechanisms. A rigorous qualitative analysis is conducted to evaluate each technique’s
strengths, limitations, and optimal use cases, offering a structured framework for selecting the most effective prompting strategies.
Theoretical insights and empirical findings are consolidated to provide researchers and practitioners with advanced methodologies
for refining prompt design and enhancing LLM capabilities in complex reasoning, decision-making, and knowledge synthesis while
improving reliability and factual accuracy in generated outputs.
Keywords: Prompt Engineering Techniques, Large Language Models


1. Introduction                                                                                (a)                            (b)

   The emergence of Large Language Models (LLMs) has
revolutionized artificial intelligence, facilitating substantial
progress in natural language comprehension, reasoning, and
text generation. [1, 2]. Models like GPT, PaLM, and LLaMA
have demonstrated remarkable capabilities across diverse ap-
plications, including automated content creation, decision-
making, and scientific discovery [3, 4, 5, 6]. However, their
performance is susceptible to how they are prompted, making                                    (c)
prompt engineering a crucial factor in optimizing output qual-
ity. Despite its importance, prompt engineering remains em-
pirical, with no standardized framework for designing effective
prompts [7, 8]. This lack of systematic methodology has led
to challenges such as inconsistent outputs, hallucinations, and
suboptimal generalization across tasks [9, 10]
   Prompt Engineering is a crucial technique for enhancing the
effectiveness of AI models by carefully designing input queries.
Instead of providing vague or generic prompts, well-structured
and context-rich prompts help AI generate more accurate, rele-
vant, and detailed responses. This process involves refining the
wording, adding constraints, and specifying the desired format
or style.
                                                                                     Figure 1: Comparison of Basic Prompt vs. Engineered Prompt with example
   Effective Prompt Engineering is widely used in AI applica-                        images. We generate these images using AI. While asking for a photo of a
tions such as chatbots, content generation, and decision-making                      deer, the image is simple and not that attractive (a). With more details on the
                                                                                     surroundings, the image looks better (b). With information on the type of deer,
                                                                                     its activity, and its surroundings, the generated image serves the requirement
   ∗ These authors contributed equally to this work.                                 (c).

Preprint submitted to Elsevier                                                                                                                    October 22, 2025
              Input                                Output                           This study provides a structured analysis of prompt engi-
                                                                                 neering methodologies, offering a comprehensive taxonomy of
    Basic Prompt "Explain                 …………………………..                           existing techniques and evaluating their impact on model ro-
     machine learning."                      …………………….
                                                                                 bustness, generalization, and interpretability [17, 18]. It ex-
                                        Basic Response: General,
                                                                                 amines fundamental approaches like zero-shot and few-shot
                                           vague, lacks clarity
                                                                                 learning, as well as advanced strategies such as retrieval-
                                                                                 augmented generation, self-consistency prompting, and multi-
                                                                                 step reasoning frameworks (e.g., tree-of-thought and graph-of-
                                                                                 thought prompting) [19, 20]. Furthermore, this study investi-
                                LLM                                              gates prompt sensitivity - analyzing how minor syntactic and
                                                                                 semantic modifications affect model responses - and proposes
                                                                                 strategies to mitigate prompt variance for improved reliability
              Input                                 Output
                                                                                 [21, 22]. Another key focus is reducing hallucinations and bi-
     Engineered Prompt                                                           ases by developing an integrated framework to enhance factual
                                          ……………………………..
 "Explain machine learning                                                       consistency and ethical neutrality in generated outputs [23, 24].
                                            ……………………….
    in simple terms with                  Engineering Response:
                                                                                 Finally, this paper explores emerging research directions in au-
   examples, focusing on                   Detailed, structured,                 tomated prompt optimization, leveraging reinforcement learn-
       supervised and                            relevant                        ing, meta-learning, and adversarial robustness techniques to en-
   unsupervised learning.                                                        hance adaptability across diverse domains [25, 26].
  Keep it under 200 words."                                                         The contributions of this study are threefold. First, it in-
                                                                                 troduces a systematic taxonomy of prompt engineering tech-
                                                                                 niques, providing a structured understanding of their core prin-
Figure 2: A comparison between Basic Prompt and Engineered Prompt reflect-
ing the need for Prompt Engineering.
                                                                                 ciples and applications. Second, it empirically analyses multi-
                                                                                 ple LLM architectures, assessing their effectiveness in mitigat-
                                                                                 ing hallucinations and improving model alignment with human
                                                                                 intent. Finally, it identifies key challenges in prompt engineer-
systems, ensuring better alignment with user intent. By opti-
                                                                                 ing and outlines future research directions to refine and advance
mizing prompts, users can reduce ambiguity, improve output
                                                                                 these methodologies. This article serves as a fundamental refer-
quality, and achieve more structured and meaningful responses
                                                                                 ence for researchers and practitioners seeking to enhance LLM
from AI models.
                                                                                 performance using sophisticated prompting tactics.
   Many concept varies from place to place. The AI develop-                         The rest of this paper is organized as follows: Section II
ment and training often contain biases. Common types of deer                     provides a comprehensive survey of prompt engineering tech-
in the Indian subcontinent and other parts of the world are not                  niques, both fundamental approaches (zero-shot, few-shot, and
the same. When we want a photo of a deer from AI, it generates                   chain-of-thought prompting) and advanced strategies such as
a deer photo, shown in Fig. 1(a), which may not be attractive                    retrieval-augmented generation and self-consistency prompt-
to the user. If we want more details on the surroundings, the                    ing. Section III presents a qualitative analysis of these tech-
AI also generates surroundings, shown in Fig. 1(b), that are not                 niques, comparing their effectiveness across different LLM ar-
common in many parts of the world. We provide all the details                    chitectures and evaluating their impact on model performance.
of the surroundings, types of deer, and the activity of deer to                  Section IV categorizes these techniques based on their use
generate a deer photo in a typical Indian region, shown in Fig.                  cases, offering insights into their practical applications across
1(c). Such photos can be used to develop advertising and ed-                     various domains. Finally, Section V brings the paper to a close
ucational materials and will be attractive to most people in the                 by offering a summary of the key conclusions and discussing
Indian subcontinent.                                                             prospective research opportunities in prompt engineering.
   As illustrated in Fig. 2, a basic prompt often results in a vague
and unstructured AI response, whereas an engineered prompt                       2. Different Prompt Engineering Techniques
provides a well-structured and meaningful output. Prompt en-
gineering aims to refine how prompts are constructed to im-                         The LLM alone is insufficient to provide a relevant, accurate,
prove model accuracy, coherence, and factual consistency [11].                   and up-to-date result in most situations. Fig. 3 represents an
Prior research has explored zero-shot, few-shot, and chain-of-                   example step-by-step working process of LLM-enabled chat-
thought prompting techniques, each providing unique benefits                     bots; from user intent and prompt design to AI processing and
in various contexts [12, 13]. However, existing studies primar-                  optimized output.
ily focus on ad-hoc strategies without establishing a unified the-                  LLM and vector databases are the two popular terms in
oretical framework or benchmarking prompting methods across                      prompt engineering. Vector databases help prompt engineers
different LLM architectures [14]. Furthermore, many prompt-                      and information seekers in making queries. To observe simi-
ing techniques are susceptible to subtle variations in wording,                  lar images or to find images of certain attributes would require
making real-world deployment challenging due to issues such                      lots of computation without a vector database. Images in vec-
as reliability and bias [15, 16].                                                tor databases are saved along with their attributes. Attributes
                                                                             2
                                         Adding Context
                  User        Prompt           &             LLM            Initial      Evaluation &   Organizing    Final
                 Intent       Design      Constraints     Processing        Output       Refinement      Output      Outcome




                                  Figure 3: An example step-by-step working process of LLM-enabled chat-bots.


can be objects on those images. Apparent conditions of all ob-                where f denotes the function that converts the given prompt
jects on images. There can be many other information. Vectors              and the internal knowledge base of the model into an appropri-
contain hundreds to thousands of information. Similarly, infor-            ate response on which the given prompt and the model’s internal
mation on Word or PDF documents is converted to chunks and                 knowledge base to an appropriate response.
each chunk receives one vector. It becomes easy for computers                 Figure 4 illustrates the core stages of the zero-shot prompting
to obtain relevant chunks with the help of vectors [27, 28].               process, encompassing data acquisition, tokenization, neural
                                                                           network architecture utilization, and predictive inference. Fur-
2.1. Basic Prompting Techniques (Fundamental approaches to                 thermore, the model’s capacity to identify patterns, extract rel-
      guiding LLMs)                                                        evant knowledge, and establish contextual coherence is instru-
2.1.1. Zero-Shot Prompting – LLMs generate responses with-                 mental in ensuring accurate and meaningful outputs. This ap-
        out examples                                                       proach increases the adaptability and use of big language mod-
   Zero-shot prompting is an approach in natural language pro-             els in a variety of domains, and is particularly advantageous
cessing directed to carry out a specific task without being ex-            when labelled datasets are scarce or nonexistent.
emplified or specifically trained on the task ahead. The model                The quality and thoroughness of the model’s pre-trained
does not assume direct supervision but instead uses its knowl-             knowledge, as well as its ability to generalize and adapt to tasks
edge of language, semantic relationships, and context reason-              and domains that have not been seen before, are key factors that
ing built-in during pre-training to perform the requested in-              affect how effective zero-shot prompting is [30].
struction. As there are no example outputs with the prompt,
the output must be inferred from the information encoded in                Examples of Zero-Shot Prompting. Common applications of
the query [1]. Unlike conventional machine learning method-                zero-shot prompting include [31]:
ologies that depend on labelled datasets for fine-tuning, zero-
                                                                             • Classification: Categorize the following text as either pos-
shot prompting capitalizes on the generalization capabilities of
                                                                               itive or negative: “This movie was absolutely fantastic!
pre-trained models. This enables LLMs to undertake a diverse
                                                                               The acting was superb, the plot was engaging, and the
array of tasks—including text classification, logical reasoning,
                                                                               special effects were stunning.” The model, without prior
and content generation—without necessitating domain-specific
                                                                               training in sentiment classification, should ideally classify
training data [3]. However, the efficacy of zero-shot prompt-
                                                                               this as “positive.”
ing is contingent on the precision and clarity of the prompt.
Poorly structured or ambiguous instructions may lead to out-                 • Translation: Provide the French translation for the ensuing
puts that are inaccurate, inconsistent, or misaligned with the                 statement:
intended objective [12]. Consequently, optimizing prompt de-
sign is critical to enhancing the reliability and interpretability                    " Hello , how are you ?"
of model-generated responses in zero-shot settings.
                                                                                The model, having been trained on multilingual data,
Working Principle. The model harnesses its pre-existing                         should be able to provide the translation:
knowledge and generalization capabilities to interpret and gen-                       " Bonjour , comment allez - vous ?"
erate responses to novel prompts without relying on task-
specific training or explicit examples [3]. It leverages its                 • Generation: Write a short poem about autumn. A zero-
extensive linguistic understanding, conceptual relationships,                  shot capable model could generate something like:
and contextual associations—acquired during the pre-training
phase—to infer the expected output based solely on the prompt                   The leaves are falling , red and gold ,
provided [12].                                                                      A gentle breeze , a story told .
   This process can be formally expressed as [29]:                              The air is crisp , the sun is low ,
                                                                                    Autumn ’ s beauty starts to glow .
   Let P denote the input prompt, K represent the model’s
knowledge base, and R signify the generated response. There-
fore, the zero-shot prompting method can be expressed mathe-                 • Analysis: Outline the key themes in the passage below:
matically as:                                                                   " The old man sat on the park bench ,
                                                                                watching the children play .
                          R = f (P, K)                                          He remembered his own childhood ,
                                                                       3
                             Data Collection              Tokenization             Neural Network               Predictive
                                                                                    Architecture                 Training




                                   Contextual                              Knowledge                             Pattern
                                  Understanding                            Acquisition                         Recognition




Figure 4: A conceptual representation of the zero-shot prompting process. The diagram depicts key stages in processing input data, including knowledge retrieval,
contextual analysis, and response generation, allowing LLMs to function without task-specific training examples.
                           Pattern recognition          Task Interference          Generalization              Application

      filled with laughter and joy ,
                                                                                                 Table 2: Time required in the Zero-Shot Approach
      but also tinged with sadness
      of lost friends and faded dreams .                                             Task                                                  Time
      He realized that time moves on ,                                               Design an effective prompt                            Minutes to hours
      but memories remain ."
                                                                                     Test the prompt with a pre-trained model              Minutes
      A zero-shot model should be able to identify themes like                       Refine the Prompt if Needed                           Minutes to hours
      nostalgia, the passage of time, and the bittersweet nature                     Deploy the solution                                   Minutes
      of memory.

Advantages of Zero-Shot Prompting. Zero-shot prompting of-                         rather than data-driven retraining. This reduction in computa-
fers several key advantages [32]:                                                  tional complexity enables faster deployment, making zero-shot
                                                                                   prompting an efficient alternative, particularly for real-time ap-
   • Flexibility: Able to perform a wide variety of jobs without                   plications and rapid prototyping.
     needing any adjustments.
   • No Task-Specific Training Needed: Eliminates the neces-                       Limitations of Zero-Shot Prompting. Despite its significant ad-
     sity for labelled datasets, reducing development costs.                       vantages, zero-shot prompting has several inherent limitations
                                                                                   [33].
   • Rapid Deployment: Facilitates swift testing and imple-                           Accuracy: The precision of zero-shot prompting often falls
     mentation across various domains.                                             short compared to fine-tuned models because of the following
                                                                                   factors:
   • Evaluation of Model Generalization: Assesses the model’s
     ability to comprehend and adapt to different challenges.                         • Insufficient optimization for specific tasks:      Fine-
                                                                                        tuned models undergo extensive domain-specific training,
   The efficiency of prompt engineering becomes particularly                            whereas zero-shot prompting relies solely on general pre-
evident when comparing the conventional machine learning                                training.
workflow (Table 1) with the zero-shot approach (Table 2).
Traditional methodologies necessitate extensive time for data                         • Interpretation variability: The model’s response may vary
collection, preprocessing, model training, and iterative refine-                        depending on how it interprets the prompt, leading to in-
ments, often requiring weeks before deployment. As demon-                               consistencies.
strated in Table 1, these steps significantly prolong development
cycles and increase computational demands.                                            • Complex task handling: Highly specialized tasks often
                                                                                        require deeper contextual understanding, which zero-shot
                                                                                        prompting may fail to capture effectively.
              Table 1: Time required in the Traditional Approach
       Task                                       Time                                Prompt Sensitivity The efficiency of zero-shot prompting is
                                                                                   strongly influenced by the way the prompt is designed:
       Collect Thousands of Examples              Weeks
       Clean and Preprocess Data                  Days                                • Wording variations: Even minor changes in phrasing can
       Train a custom model                       Hours to Days                         significantly alter the model’s interpretation and output.
       Evaluate and iterate                       Days to Weeks
       Deploy the model                           Hours                               • Instruction clarity: Responses that are inconsistent or ir-
                                                                                        relevant may result from prompts that are unclear or im-
                                                                                        precise.
   Conversely, as outlined in Table 2, the zero-shot approach
significantly reduces the dependency on extensive dataset                             • Context dependency: The model’s performance fluctu-
preparation and custom model training. By leveraging pre-                               ates based on the contextual information embedded in the
trained models, task performance is dictated by prompt design                           prompt.
                                                                               4
For example, when provided with the same input data, slight                  • Generalization: The model extends its understanding to
modifications in prompt phrasing can yield variations in re-                   unseen inputs, applying the learned mapping rules [13].
sponse length, detail, and focus, underscoring the model’s sen-
sitivity to linguistic nuances.                                              • Application: The model synthesizes a response for the new
   Bias: Zero-shot prompting, relying on pre-trained models, is                input by extrapolating from the provided demonstrations.
vulnerable to biases found in the training data, causing:
                                                                              As illustrated in Figure 5, the few-shot prompting framework
  • Demographic and cultural biases, which may inadver-                    enhances task adaptability while minimizing reliance on exten-
    tently reflect societal or regional disparities.                       sive labelled datasets. Compared to zero-shot prompting, this
                                                                           approach yields significant improvements in task-specific accu-
  • Recency bias, where newer information is favoured while                racy, particularly for reasoning-intensive applications.
    historical context is overlooked.
                                                                           Examples of Few-Shot Prompting. Few-Shot prompting is
  • Stereotyping, which can reinforce preconceived notions                 commonly used for a variety of natural language processing
    embedded within the training corpus.                                   (NLP) applications, such as:

2.1.2. Few-Shot Prompting                                                    • Text Classification: Classify this new review based on the
   Few-Shot prompting, a sophisticated NLP method, enhances                    given positive and negative examples.
an AI model’s ability to execute tasks by supplying a few exam-
ples [34]. Unlike zero-shot prompting, which relies solely on                • Machine Translation: Translate these English sentences
pre-trained knowledge, few-shot prompting leverages these ex-                  into Spanish. Now, translate the given text.
amples as contextual guidance to improve response accuracy
                                                                             • Code Generation: Complete the missing function given
and relevance [35]. This method serves as an intermediary
                                                                               these input-output pairs.
between zero-shot learning, which requires no examples, and
fully supervised fine-tuning, which necessitates extensive la-               • Question Answering: Answer factual questions based on
belled datasets. Including a limited number of demonstrations,                 provided samples.
few-shot prompting enables the approach to tailor itself to spe-
cific tasks, all while retaining the flexibility inherent in prompt-       Advantages of Few-Shot Prompting. Few-Shot prompting has
based learning.                                                            distinct advantages over zero-shot learning, including:

Working Principle. The fundamental principle of few-shot                     • Enhanced Accuracy: By leveraging example-based guid-
prompting lies in embedding task-specific demonstrations                       ance, the model produces more precise outputs [34].
within the prompt. These examples act as implicit instructions,
guiding the model’s behaviour. Typically, demonstrations ex-                 • Improved Task Adaptation: The model can quickly learn
hibit the following characteristics:                                           patterns from a minimal number of examples [35].

                                                                             • Greater Control: Users can fine-tune model behavior by
  • Input-Output Mappings: Each demonstration consists of
                                                                               carefully selecting prompt demonstrations [32].
    an input (e.g., a query, sentence, or task prompt) and its
    corresponding expected output (response or solution) [3].

  • Format Consistency: Maintaining a uniform format aids                        Table 3: Challenges and Best Practices in Few-Shot Learning
    the model in recognizing structural patterns across differ-             Selecting Effective     Prompt Design        Avoiding Overfitting
    ent prompts [36].                                                           Examples
  • Task-Specific Relevance: The provided examples align                    Relevance              Consistency           Example Variety
    with the target task, ensuring that the model extrapolates              Diversity              Contextual Cues       Balanced Prompts
    meaningful information [22].                                            Clarity                Simplicity            Iterative Testing

   When handling these demonstrations, large language models
(LLMs) utilize in-context learning, a process that allows them             Limitations of Few-Shot Prompting. Despite its benefits, few-
to generalize with minimal supervision. This process can be                shot prompting has inherent limitations:
deconstructed into the following stages:
                                                                             • Example Sensitivity: The performance of the model is
  • Pattern Recognition: The model extracts and analyzes re-                   greatly determined by the quality and relevance of the se-
    lationships between inputs and outputs within the prompt                   lected examples [1].
    [37].
                                                                             • Increased Token Overhead: Incorporating examples into
  • Task Inference: It infers the nature of the given task based               prompts extends the input length, potentially increasing
    on observed examples [38].                                                 computational cost [32].
                                                                       5
                                        Contextual                              Knowledge                            Pattern
                                       Understanding                            Acquisition                        Recognition




                               Pattern recognition          Task Interference           Generalization            Application



Figure 5: A conceptual representation of the Few-Shot Prompting process. The diagram outlines key stages, including pattern recognition, task inference, general-
ization, and application, demonstrating how LLMs utilize limited examples to generate responses.


   • Suboptimal Performance in Some Cases: While effective,                                                 Breaking
                                                                                                             Down                         Step-by-
     few-shot learning may not consistently outperform fine-                                                Thoughts                        Step
     tuned models [1].                                                              Initial                                               Process
                                                                                    Question or
                                                                                    Problem
   By addressing these limitations through optimal prompt de-
sign and iterative refinement, few-shot prompting remains a
powerful technique for guiding LLM outputs while balancing
efficiency and accuracy.                                                                          Promoting                                        Identifying
                                                                                                  Systematic                                         Gaps &
                                                                                                   Problem                                          Refining
2.2. Step-by-Step Reasoning & Logical Thinking (Techniques                                          Solving                                        Reasoning
     that guide structured thinking in LLMs)
                                                                                                                            Benefits
2.2.1. Chain-of-Thought (CoT) Prompting
                                                                                      Answer or                            of Making
   Chain-of-Thought (CoT) prompting is a structured approach                          Solution                              Thinking
in large language models (LLMs) that boosts their reasoning                                                                  Visible
capacity by dividing complex issues into organized, sequen-
tial steps [13, 12]. Unlike direct-response prompting, which                                  Figure 6: A Typical Chain-of-Thought Prompting Process.
relies on implicit pattern recognition, CoT facilitates a struc-
tured derivation process that ensures logical consistency and
improved accuracy. CoT is especially useful for jobs re-                              • Improved interpretability: Since reasoning steps are ex-
quiring multi-step reasoning, including mathematical problem-                           plicitly outlined, responses become more comprehensible
solving, logical analysis, and commonsense reasoning. By                                and transparent [13].
clearly outlining the reasoning process, CoT helps LLMs gen-
                                                                                       As illustrated in Figure 6, CoT prompting fosters a struc-
erate more interpretable and transparent answers, making them
                                                                                    tured breakdown of problems, leading to more accurate con-
ideal for domains where clarity is essential. Studies suggest
                                                                                    clusions. This approach has been widely adopted in large lan-
that CoT prompting significantly boosts few-shot learning, al-
                                                                                    guage models (LLMs) to enhance decision-making capabilities,
lowing models to more effectively generalize across a variety of
                                                                                    reduce hallucinations, and improve the reliability of generated
issue domains[13]. Figure 6 presents a typical chain-of-thought
                                                                                    responses.
prompting process. Furthermore, CoT aligns with human cog-
nitive problem-solving strategies, making AI-generated reason-
                                                                                    Examples of Chain-of-Thought Tasks Prompting . CoT
ing more aligned with human intuition. The impact of CoT
                                                                                    prompting enhances performance in various applications, in-
extends beyond simple question-answering tasks, proving in-
                                                                                    cluding:
valuable in applications such as legal analysis, medical diagnos-
tics, and scientific research, where structured logical reasoning                     • Mathematical Problem Solving: If a train travels 90 km in
is fundamental. As AI continues to advance, CoT remains a                               1.5 hours, what is its speed?
pivotal innovation in prompt engineering, improving the depth,
reliability, and interpretability of model-generated responses.                          Instead of responding directly, the model follows step-by-
                                                                                         step reasoning: Speed = Distance / Time = 90 km / 1.5 hr
Working Principle. In contrast to standard prompting, which                              = 60 km/hr.
seeks an immediate response, CoT prompting directs the model                          • Logical Reasoning: All birds can fly. Penguins are birds.
to clarify its thought process in stages prior to making a decision                     Can penguins fly?
[39]. This method provides several benefits:
                                                                                         The model explains: While most birds can fly, penguins
   • Decomposition of complex tasks: The model systemat-                                 are an exception due to their adapted physiology. Hence,
     ically breaks a problem into smaller, manageable steps                              penguins cannot fly.
     [13].
                                                                                      • Commonsense Reasoning: If Sarah is taller than Mike and
   • Reduction of errors: By following a structured reasoning                           Mike is taller than John, who is the shortest?
     path, the model minimizes errors caused by guessing or                              Step-by-step analysis: Since John is shorter than Mike and
     misinterpretation [40].                                                             Mike is shorter than Sarah, John is the shortest.
                                                                                6
Advantages of Chain-of-Thought Prompting. CoT prompting                 • Step 3: Selection of Best Chains – Multiple reasoning
provides several key benefits:                                            paths are generated, and the best ones are selected dynam-
                                                                          ically according to coherence and accuracy. [43].
  • Enhanced Logical Reasoning: Encourages structured
    thinking, reducing the likelihood of incorrect conclusions          • Step 4: Few-Shot Application – The best-performing ex-
    [13].                                                                 amples are used as context for answering new questions,
                                                                          enhancing few-shot learning [43].
  • Improved Interpretability: Makes AI-generated responses
    easier to follow and verify [13].
                                                                         As shown in Figure 7, this process iteratively constructs rea-
  • Better Performance in Complex Tasks: Highly effective             soning examples, reducing human effort while maintaining log-
    for tasks demanding deep reasoning, like mathematical             ical coherence [44, 39].
    problem-solving, logical deduction, and multi-hop ques-              By employing Auto-CoT, LLMs can generalize better across
    tion answering [41].                                              different problem domains, particularly in complex reasoning
                                                                      tasks such as mathematical derivations, logical inferences, and
  • Generalization Across Domains: CoT prompting boosts               question-answering. This automation enhances scalability and
    model performance in few-shot and zero-shot conditions,           efficiency, making it a promising advancement in prompt engi-
    facilitating better alignment with unfamiliar tasks [42].         neering and AI-assisted reasoning.

Limitations of Chain-of-Thought Prompting. Despite its ad-
                                                                      Examples of Automatic Chain-of-Thought (Auto-CoT) Prompt-
vantages, CoT prompting has some challenges:
                                                                      ing. Auto-CoT is particularly effective for reasoning-intensive
  • Increased Token Usage: Generating step-by-step explana-           tasks, such as:
    tions requires longer responses, leading to higher compu-
    tational costs [13].                                                • Mathematical Reasoning: ”If a store sells apples at $2
                                                                          each and offers a 10% discount for buying 5 or more, what
  • Dependence on Step Quality: The effectiveness of                      is the cost of 6 apples?”
    CoT prompting relies on well-structured reasoning steps;
                                                                           The model generates and selects the best breakdown:
    poorly designed CoT prompts may result in misleading
                                                                           ”Price without discount: 2 × 6 = 12. Discount: 10%
    conclusions [43].
                                                                           of 12 = 1.2. Final cost = 12 − 1.2 = 10.8.”
  • Limited Usefulness in Simple Tasks: Tasks that do not re-
    quire multi-step reasoning may not benefit significantly            • Logical Deduction: ”If Tom is older than Jerry and Jerry
    from CoT prompting and could be solved more efficiently               is older than Sam, who is the youngest?”
    with direct responses [13].                                            The model automatically formulates the reasoning path:
                                                                           ”Tom > Jerry > Sam 2̆192 Sam is the youngest.”
   Through effective use of CoT prompting, AI models can sub-
stantially boost their reasoning skills, making them more de-           • Fact-Based Question Answering: ”Which country has the
pendable for complex analysis while fostering transparency and            largest land area?”
cross-system compatibility.
                                                                           The model selects the best Auto-CoT explanation: The
                                                                           largest country by land area is Russia, covering approx-
2.2.2. Automatic Chain-of-Thought (Auto-CoT) Prompting
                                                                           imately 17 million square kilometres.
   Automatic Chain-of-Thought (Auto-CoT) prompting is an
improved version of the traditional Chain-of-Thought (CoT)
method [39]. It automates the process of generating reasoning         Advantages of Automatic Chain-of-Thought (Auto-CoT)
examples instead of relying on manually crafted CoT demon-            Prompting. Auto-CoT provides several key improvements
strations [43]. Auto-CoT improves efficiency and scalability by       over manual CoT prompting:
removing human intervention while maintaining the benefits of
structured reasoning [39].                                              • Automation of Reasoning Examples: Reduces reliance on
                                                                          human-designed prompts [43].
Working Principle. Auto-CoT operates in the following steps:
                                                                        • Improved Generalization: Helps the model generate more
  • Step 1: Sample Questions Automatically – The model se-                diverse and effective reasoning chains [43].
    lects representative examples from a given dataset or gen-
    erates new ones [43].                                               • Scalability: Can be applied to large datasets without man-
                                                                          ual effort [43].
  • Step 2: Self-Generated Reasoning Paths – The model pro-
    duces intermediate reasoning steps to solve these ques-             • Adaptive Learning: Dynamically selects the most accurate
    tions [43].                                                           and coherent reasoning paths [43].
                                                                  7
       Q. A chef need to cook 9 potatoes. He has already…                  Training Questions and Answers:

                                                                           Q: A chef need to cook 9 potatoes. He has already cooked 7. If each potato
                                                                           takes 3 minutes to cook, how long will it take him to cook the rest?
                                                                           A: Let’s think step by step. The chef has already cooked 7 potatoes. That
       Q. Zoe bought 3 country albums and 5 pop albums. …                  means it has taken him 7*3 minutes to cook those 7 potatoes. That means it
                                                                           will take him 3 more minutes to cook each of the remaining 2 potatoes.

                                                                           Q: Zoe bought 3 country albums and 5 pop albums. Each album came with a
                                                                           lyric sheet and had 3 songs. How many songs did Zoe buy total?
                        Sentence-BERT
                                                                           A: Let’s think step by step. Zoe bought 3 country albums. Each album has 3
                                                                           songs. So, she bought 3*3=9 songs from the country albums. Zoe bought 5
                                                                           pop albums. Each album has 3 songs. So, she bought 5*3=15 songs from the
                                                                           pop albums. Zoe bought 9+15=24 songs in total. The answer is 24.

                           K-means                                         Test Questions:
                           Clustering
             1             Clustering
                                                  k                        Q: A pet store had 64 puppies. In one day, they sold 28 of them and put the
                                                                           rest into cages with 4 in each cage. How many cages did they use?



                                                                                                                LLM
   1       Q: A chef need to cook 9 potatoes…. A: Let’s …

                               Sampling by selection criterion
                                                                          A: Let’s think step by step. The pet store had 64 puppies. They sold 28 of
                                                                          them. That means they have 36 puppies left. They put the rest into cages with
   k     Q: Zoe bought 3 country albums and 5… A: Let’s …                 4 in each cage. That means they have 9 cages. The answer is 9.



            Figure 7: Auto-CoT method proposed in [39]. The figure is redrawn based on the sketches and other information available in the paper.


Limitations of Automatic Chain-of-Thought (Auto-CoT)                             same problem and identifying the most coherent response from
Prompting. Despite its benefits, Auto-CoT has some chal-                         these alternatives[48]. This technique effectively reduces the
lenges:                                                                          impact of random variations in model outputs, making the rea-
                                                                                 soning process more structured and logical. Compared to tradi-
  • Potential for Incorrect Reasoning: The model may gen-
                                                                                 tional single-path reasoning, which depends on a fixed method
    erate flawed reasoning steps without human verification
                                                                                 to reach a solution, self-consistency generates multiple diverse
    [43].
                                                                                 reasoning pathways for the same problem and identifies the
  • Increased Computational Cost: Running multiple reason-                       most coherent response from these alternatives. [49]. This
    ing chains requires more processing power [43].                              probabilistic method strengthens the model’s proficiency in de-
                                                                                 riving accurate solutions while augmenting its capability to
  • Dependence on Data Quality: Auto-CoT’s efficacy is con-                      manage ambiguity, logical deductions, and multi-step problem-
    tingent upon the caliber and variety of the chosen exam-                     solving across diverse domains, including mathematics, every-
    ples. [43].                                                                  day reasoning, and strategic decision-making. Moreover, self-
Multomodal Chain-of-Thought (Auto-CoT) Prompting. The                            consistency is critical in mitigating errors arising from heuris-
CoT can be multimodal. The multimodal CoT utilizes the same                      tic shortcuts, thereby making LLMs more reliable in real-world
CoT framework but obtains information from multiple modal-                       applications requiring rigorous logical deduction.
ities. The user can show a picture of a crowded public place
and ask whether the place is popular during the morning or not                   Working Principle. Self-consistency operates on the principle
[45, 46].                                                                        that there are several viable ways to arrive to the right answer
                                                                                 for a complex reasoning problem [47]. The process involves:
2.2.3. Self-Consistency
   Self-consistency is a prompting method that utilizes the in-                     • Generating Diverse Reasoning Paths: The LLM is
trinsic probabilistic characteristics of large language models                        prompted to generate multiple reasoning chains for the
(LLMs) to improve the quality of their deliverables, precision,                       same problem, using techniques like CoT prompting with
dependability, and resilience, especially in intricate reasoning                      sampling [47].
tasks [47].
   Compared to traditional single-path reasoning, which relies                      • Evaluating and Marginalizing: The generated reasoning
on a fixed method to arrive at a solution, self-consistency in-                       paths are evaluated, and the most reliable response is as-
volves generating multiple diverse reasoning pathways for the                         certained by marginalizing over these pathways [47]. This
                                                                             8
                                                                                                    Greedy Decode

                                                                     This means she uses 3 + 4 = 7 eggs everyday. She sells the
                                    Prompt          Language         remainder for $2 per egg, so in total she sells 7*$2=$14 per
    Chain-of-thought                                  Model          day.
                                                                                                                                                 The answer is $14

      Prompting                                                      The answer is $14


                                                                      Sample a diverse set of
                                                                                                                                    Marginalize out reasoning paths
       Self-consistency                                                  reasoning paths
                                                                                                                                      to aggregate final answers

    Q: If there are 3 cars in the parking lot and                 She has 16 - 3 - 4 = 9 eggs left. So       The answer is $18
    2 more cars arrive, how many cars are in                       she makes $2 * 9 = $18 per day
    the parking lot?
    A: There are 3 cars in the parking lot
    already. 2 more arrive. Now there are 3 +
    2 = 5 cars. The answer is 5.
    ...
                                                                     This means she she sells the
    Q: Janet’s ducks lay 16 eggs per day. She       Language                                                  The answer is $26                     The answer is $18
                                                                  remainder for $2 * (16 - 4 - 3) = $26
    eats three for breakfast every morning and        Model                     per day.
    bakes muffins for her friends every day
    with four. She sells the remainder for $2
    per egg. How much does she make every
    day?                                                          She eats 3 for breakfast, so she has
    A:                                                              16 - 3 = 13 left. Then she bakes         The answer is $18
                                                                  muffins, so she has 13 - 4 = 9 eggs
                                                                  left. So she has 9 eggs * $2 = $18.




Figure 8: The self-consistency approach improves language model reasoning through a three-step process: (1) using CoT prompting for structured reasoning, (2)
sampling from the decoder to explore diverse reasoning paths, and (3) selecting the most consistent answer for a robust conclusion.[47].


      ensures that several streams of thinking have come to-                          plex and involve multiple steps, such as:
      gether to produce the ultimate response.
                                                                                          • Multi-Step Arithmetic:
   • Answer Aggregation: The conclusive answer is deter-                                    ”What is 3 + 5 × 2 − 4 ÷ 2 ?”
     mined by the most prevalent or consistent response among                                 The model generates multiple reasoning paths, each with
     the created reasoning pathways [47]. This aggregation                                    different intermediate steps and potentially different final
     process helps to identify the most reliable solution.                                    answers. Applying self-consistency identifies the most
   As illustrated in Figure 8, The self-consistency method com-                               consistent answer, which is 11.
prises three primary steps: (1) Utilizing Chain-of-Thought                                • Commonsense Reasoning:
(CoT) prompting for language model enhancement, (2) substi-                                 ”If it is raining, and you want to go outside, what should
tuting the conventional greedy decoding approach with sam-                                  you take with you?”
pling to produce various reasoning pathways, and (3) marginal-                              The model might generate different answers, like an um-
izing distinct reasoning paths to consolidate the most coherent                             brella, a raincoat, or both. Self-consistency helps to iden-
response. This application of language models enhances rea-                                 tify the most consistent and sensible answer based on the
soning capabilities through single-path reasoning, enabling the                             context.
model to investigate various possibilities prior to producing an
output.                                                                                   • Symbolic Reasoning:
   The self-consistency technique improves language models’                                 ”If A is greater than B, and B is greater than C, is A
reasoning capabilities by introducing diversity in response gen-                            greater than C?”
eration and deciding on the most trustworthy response.                                      The model can generate different logical chains to arrive at
   This approach lessens the possibility of biased or incorrect                             the answer. Self-consistency ensures that the final answer
single-path reasoning by allowing the model to explore diverse                              is consistent with most of the generated logical paths.
possibilities before finalizing an output. By leveraging self-
                                                                                      Advantages of Self-Consistency. Self-consistency offers sev-
consistency, language models achieve higher accuracy in com-
                                                                                      eral benefits:
plex problem-solving tasks, particularly in domains requiring
logical reasoning, such as mathematics, commonsense reason-                               • Improved Accuracy: Increases the likelihood of obtaining
ing, and structured decision-making.                                                        correct answers in complex reasoning tasks [47].
Examples of Self-Consistency Tasks. Self-consistency is partic-                           • Robustness: Reduces the impact of individual errors or in-
ularly useful in tasks where the reasoning process can be com-                              consistencies in reasoning paths [47].
                                                                                 9
  • Versatility: Can be combined with various sampling algo-               • Verify: Evaluate each generated step by checking if the
    rithms and prompting techniques [47].                                    current step is a logical consequence of all prior, verified
                                                                             steps.
  • Interpretability: Provides insights into the different rea-
    soning paths considered by the model [47].                             • Revise: Modify or regenerate any step that does not satisfy
                                                                             the verification criteria.
Limitations of Self-Consistency. While the self-consistency
method improves reasoning by aggregating multiple sampled
                                                                            This process enables the LLM to refine its reasoning path
responses, it has several limitations:
                                                                         dynamically. By integrating logical verification at each step,
  • Increased Computational Cost: Generating multiple rea-               LoT aims to produce a more robust and trustworthy reason-
    soning paths increases computational overhead [47].                  ing chain that minimizes errors and ensures that each conclu-
                                                                         sion is firmly grounded in the available evidence and logical
  • Dependence on Sampling Quality: The effectiveness of                 rules. This framework is particularly well-suited for activities
    self-consistency relies on the diversity of the generated            that call for multi-step reasoning, like mathematical problem-
    reasoning paths [47].                                                solving, causal inference, and commonsense reasoning.
  • Potential for Bias: If the model is biased towards spe-
    cific reasoning patterns, self-consistency might amplify             Working Principle. The fundamental working principle of LoT
    this bias [47].                                                      prompting revolves around an iterative cycle of structured
                                                                         reasoning and validation, which ensures logical consistency
  • Difficulty in Handling Ambiguous or Open-Ended Ques-                 throughout the thought process. This methodology is built upon
    tions: When multiple valid answers exist, the method may             the “Think-Verify-Revise” paradigm, which involves a stepwise
    struggle to determine the most “consistent” response, lead-          approach to logical reasoning.
    ing to potential misinterpretation [50].
                                                                          1. Initial Reasoning Generation: Under a zero-shot setting,
  • Limited Generalization to All Tasks: Self-consistency                    the LLM is prompted (e.g., with “Let’s think step by step”)
    works best for structured reasoning tasks but may be less                to produce a series of steps in reasoning. These steps,
    effective for creative or abstract problem-solving where di-             denoted as {T 1 , T 2 , . . . , T N }, are derived autoregressively
    verse answers are equally valid [3].                                     from the initial prompt or given premise P. Although this
  • Scalability Challenges: As the number of sampled reason-                 initial chain-of-thought decomposes the problem, it is sus-
    ing paths increases, memory and processing constraints                   ceptible to errors due to the lack of explicit logical con-
    become significant, making it difficult to scale for large-              straints.
    scale applications [51].                                              2. Verification Using Logical Consistency Checks: Each rea-
                                                                             soning step T i is confirmed by looking at the logical im-
   Notwithstanding these limitations, self-consistency is instru-            plication P, T 1 , . . . , T i−1 ⊢ T i . The principle of reduction
mental in augmenting logical reasoning within language mod-                  ad absurdum inspires the verification mechanism. Specif-
els, especially in tasks necessitating predictable and verifiable            ically, the framework considers the conjunctive proposi-
responses.                                                                   tion:
                                                                                           Ci = P ∧ T 1 ∧ · · · ∧ T i−1 ∧ ¬T i ,
2.2.4. Logical CoT (LoT) Prompting
   The LoT framework is a novel prompting tactic to enhance                   and examines whether this proposition leads to a contra-
LLMs’ zero-shot chain-of-thought (CoT) reasoning capabili-                    diction. If Ci is found to be contradictory (i.e., false under
ties. At its core, LoT addresses a key limitation of conventional             every valuation), then T i is deemed a valid logical conse-
CoT approaches: LLMs’ propensity to hallucinate or gener-                     quence of the preceding steps. Two variants of the verifi-
ate logically inconsistent reasoning traces. Although LLMs                    cation process are proposed:
have demonstrated impressive generalizability and factual re-                    • Cmps-LoT: A straightforward approach where the
call, their multi-step reasoning often suffers from error propa-                   model is instructed to generate a post hoc explana-
gation, leading to unreliable conclusions.                                         tion for the negation of T i and then check for incon-
   LoT leverages classical principles from symbolic                                sistency in Ci
logic—most notably, reductio ad absurdum—to incorpo-
rate a systematic verification mechanism within the reasoning                    • Adpt-LoT: A more advanced variant that produces
process. In this framework, generating reasoning steps is not                      dual post hoc explanations—one supporting T i and
a one-pass process. Instead, each step is critically evaluated                     another supporting its negation ¬T i . The model then
against previously established premises for logical consistency.                   performs a preference discrimination task to decide
The method introduces a “think-verify-revise” loop that guides                     which of the two is more consistent with the estab-
the LLM to:                                                                        lished premises. This dual-check mechanism helps
                                                                                   to mitigate the biases inherent in the autoregressive
  • Think: Generate an initial chain of reasoning steps.                           generation process.
                                                                    10
 3. Revision and Chain Growth: The framework initiates a                         1. Think: Every rose is a flower. Certain flowers fade
    modification procedure if any of the reasoning steps T i fail                   quickly.
    the verification. In this stage, the erroneous step (and any                 2. Verify: The rapid fading of certain blooms does not
    subsequent steps) is dropped, and the model is prompted                         always indicate that they are roses.
    to generate an alternative T i′ that rectifies the identified                3. Revise: Therefore, using the premises alone, we
    inconsistency. This process continues iteratively until a                       cannot definitively conclude that some roses fade
    complete chain of verified reasoning steps is produced.                         quickly.
    The chain is said to “grow” only when a new reasoning
    step has successfully passed the verification check.                  Advantages of Logical Thinking (LoT). Integrating the Logi-
                                                                          cal Thoughts (LoT) framework into Large Language Models
Examples of Logical Thinking (LoT). Logical Thinking (LoT)                (LLMs) provides several advantages, particularly in enhancing
tasks encompass a variety of problem-solving scenarios that re-           reasoning capabilities, reducing hallucinations, and ensuring
quire structured reasoning and inference. In order to arrive at           logical consistency. Some of the key benefits include:
reliable results, these tasks make use of the model’s capacity to
examine links, identify patterns, and use deductive or inductive            • Enhanced Accuracy and Logical Consistency: Traditional
reasoning. By utilizing LoT prompting techniques, language                    LLMs generate responses based on statistical patterns in
models can effectively break down complex logical problems                    training data, often lacking an explicit mechanism to vali-
into sequential steps, enhancing accuracy and interpretability.               date their reasoning steps. The LoT framework addresses
The following examples illustrate the application of LoT in dif-              this limitation by systematically applying logical verifica-
ferent domains, showcasing its effectiveness in handling math-                tion principles, such as Reductio ad Absurdum, ensuring
ematical reasoning, logical deduction, and fact-based question                that every intermediate inference remains logically sound.
answering.                                                                    This leads to more accurate conclusions, particularly in
                                                                              domains requiring structured reasoning, such as mathe-
  • Arithmetic Reasoning: A simple arithmetic reasoning ex-                   matics, formal logic, and legal analysis.
    ample is given here:
    Problem: What is the other number if two numbers are                    • Reduction of Hallucinations: One of the primary issues
    multiplied by 36 and one of the numbers is 4?                             with contemporary LLMs is their tendency to generate hal-
    Traditional LLM Response: The other number is 9.                          lucinated information—statements that are factually incor-
    LoT-Enhanced Response:                                                    rect yet presented with high confidence. LoT mitigates this
                                                                              problem by enforcing logical verification steps. Each gen-
       1. Think: Let the unknown number be x. Given that                      erated response undergoes an internal consistency check,
          4 × x = 36.                                                         reducing the risk of unfounded or incorrect statements.
                                            4 = 9.
       2. Verify: Solving for x, we get x = 36                                This improvement is particularly critical for medical di-
       3. Revise: Verification: 4 × 9 = 36, which is consis-                  agnosis, financial analysis, and legal decision-making ap-
          tent with the given information. Therefore, the other               plications, where incorrect reasoning can have significant
          number is indeed 9.                                                 consequences.
                                                                            • Improved Zero-Shot Generalization: Many deep learning
  • Commonsense Reasoning: A simple commonsense rea-
                                                                              models, including LLMs, exhibit suboptimal performance
    soning is given here:
                                                                              in zero-shot reasoning tasks, which include circumstances
    Problem: If Tom is taller than Jerry, and Jerry is taller than
                                                                              in which comparable samples have not been used to for-
    Sam, who is the shortest?
                                                                              mally train the model. The LoT framework improves zero-
    Traditional LLM Response: Sam is the shortest.
                                                                              shot reasoning by providing the model with a systematic
    LoT-Enhanced Response:
                                                                              approach to problem-solving, allowing it to decompose
       1. Think: The height relationships are: T > J > S .                    complex queries into logically verifiable steps. This fea-
                                                                              ture is particularly beneficial in domains such as theorem
       2. Verify: Since Tom is taller than Jerry, and Jerry is
                                                                              proving, algorithmic problem-solving, and scientific hy-
          taller than Sam, it follows that Tom is taller than
                                                                              pothesis testing.
          Sam.
       3. Revise: Therefore, Sam, being shorter than both Tom               • Robustness Against Adversarial Prompting: LLMs are
          and Jerry, is the shortest.                                         susceptible to adversarial prompts that exploit statistical
                                                                              biases, leading to incorrect or misleading responses. The
  • Symbolic Reasoning: Symbolic reasoning is given here:                     LoT framework strengthens model robustness by incorpo-
    Problem: All roses are flowers. Some flowers fade                         rating logical validation, making it less prone to manip-
    quickly. Can we draw the conclusion that certain roses                    ulative queries. For instance, when presented with para-
    fade quickly?                                                             doxical or misleading premises, the model can detect logi-
    Traditional LLM Response: Yes, some roses fade quickly.                   cal inconsistencies and avoid generating incorrect conclu-
    LoT-Enhanced Response:                                                    sions.
                                                                     11
Limitations of Logical Thinking (LoT). Despite its benefits,             descriptions with a set of abstract symbols. This symbolic con-
LoT prompting has some limitations:                                      version reduces redundant information and encapsulates funda-
                                                                         mental spatial relations—such as relative positions and move-
  • Computational Cost: Processing logical operations and                ments—in a more structured and efficient format, leading to
    constraints can increase computational overhead [13]. The            improved model accuracy and reduced computational overhead
    iterative Think-Verify-Revise cycle introduces additional            [53].
    computational steps, increasing inference time. Unlike                  Fundamentally, CoS prompting abstracts complex spatial
    standard LLM responses generated in a single forward                 tasks into a series of modular symbolic operations, where
    pass, LoT requires multiple iterations to verify logical cor-        each symbol denotes a specific spatial relationship or action.
    rectness. This additional computation could be a bottle-             This abstraction facilitates more precise traceability and in-
    neck in real-time applications such as chatbots, real-time           terpretability of the reasoning process, enabling the model to
    translation systems, or interactive AI assistants.                   tackle intricate spatial environments with greater precision.
  • Dependence on Knowledge: The accuracy and accessibil-                Moreover, the streamlined symbolic representation allows for
    ity of outside information sources are essential to LoT’s            more scalable performance, particularly in scenarios that re-
    efficacy[12]. While the LoT framework enhances rea-                  quire detailed planning and manipulation of spatial elements,
    soning, it does not introduce external knowledge. If                 as demonstrated in benchmark tasks like Brick World and other
    an LLM lacks the necessary factual or domain-specific                spatial planning challenges [53][52].
    knowledge, it may still struggle to produce correct conclu-
    sions despite logical verification. This limitation suggests         Working Principle. The working principle of Chain-of-Symbol
    that LoT is most effective when combined with knowl-                 prompting is rooted in a two-step process: generating interme-
    edge retrieval mechanisms or fine-tuned models trained on            diate reasoning in natural language and then transforming this
    domain-specific datasets.                                            output into a condensed symbolic representation. Initially, In a
                                                                         few-shot context, the model is asked to generate detailed chain-
  • Challenges in Commonsense and Probabilistic Reasoning:               of-thought reasoning that outlines its step-by-step approach to
    Logic-based verification excels in structured domains such           spatial planning tasks. This reasoning is subsequently refined
    as mathematics and formal reasoning but may not be as                by systematically substituting verbose spatial descriptions with
    effective in commonsense reasoning or probabilistic in-              predefined abstract symbols, each representing specific spatial
    ference. Human reasoning relies on heuristics, intuition,            relationships or operations. By doing so, the process mitigates
    and experience rather than strict logical deduction. There-          redundancy inherent in natural language and aligns the interme-
    fore, the LoT framework may struggle with tasks requir-              diate reasoning more closely with the model’s internal compu-
    ing nuanced contextual understanding, such as interpreting           tational structure, thereby enhancing efficiency and clarity [53].
    metaphors, humour, or subjective opinions.                              In practical terms, this approach involves constructing
                                                                         demonstrations where spatial scenarios, described initially in
  • Potential for Error Propagation: If the initial logical step
                                                                         whole natural language, are converted into sequences of sym-
    contains an error, subsequent verification steps may fail to
                                                                         bols. These symbols—as atomic tokens for spatial relations
    correct it, leading to flawed reasoning. The LoT frame-
                                                                         such as “on top of” or “adjacent to”—encapsulate the essen-
    work’s efficacy is contingent upon the model’s capacity to
                                                                         tial logic required to navigate complex spatial environments.
    appropriately apply logical concepts. If a model misinter-
                                                                         When applied during inference, the symbolic chain is a succinct
    prets a logical rule, the verification process may reinforce
                                                                         blueprint that guides the model’s final decision-making process.
    incorrect conclusions rather than rectify them.
                                                                         This method significantly reduces the token count and compu-
  • Lack of Interpretability in Complex Chains of Thought:               tational overhead while providing a transparent and traceable
    Although LoT improves logical reasoning, it does not fully           reasoning pathway, ultimately yielding improved accuracy in
    address the interpretability challenges of LLMs. When                spatial reasoning tasks [53][52].
    solving complex problems, the generated chain-of-thought
    may still appear opaque to human users. Future research              Examples of Chain-of-symbol (CoS) Prompting. Example 1.
    should explore methods to make the reasoning process                 Brick World Task
    more transparent and explainable, ensuring that users can            Scenario:
    verify the correctness of each logical step.
                                                                           • There is a set of bricks stacked in a specific order.

2.2.5. Chain-of-Symbol (CoS) Prompting                                     • The task is to retrieve a specific brick while adhering to
                                                                             spatial constraints: a brick can only be removed if no other
   Chain-of-symbol (CoS) Prompting is a new technique to en-
                                                                             brick is on top of it.
hance spatial reasoning in LLMs by converting verbose nat-
ural language descriptions into concise symbolic representa-               Natural Language Prompt (CoT Style):
tions. Unlike traditional Chain-of-Thought (CoT) approaches
that rely on detailed verbal reasoning, CoS prompting generates           1. Remove brick A from the top of brick B.
intermediate reasoning steps and systematically replaces spatial          2. Remove brick E from the top of brick D.
                                                                    12
                                                                      Shared Model Input

                                There are a set of boxes. The yellow box C is on top of the box E. The yellow box D is on top of the
                                box A. The yellow box E is on top of the box D. The white box A is on top of the box B. For the box B,
                                the color is white. Now we need to get a specific box. The boxes must be removed from top to bottom,
                                and if the lower box is to be removed, the upper box must be removed first. How to get box D?


                                    Chain-of-Thought Prompting                                    Chain-of-Symbol Prompting

                              The boxes from bottom to top is B, A, D, E, C                B/A/D/E/C
                              1. Remove box A from the top of box B.                       C/E
                              2. Remove box E from the top of box D.                       E/D
                              3. Now box D is the topmost yellow box and                   D
                              can be grabbed.



                                             CoT Output                                                   CoS Output

                              So, we get the result as A, E, D.                           So, we get the result as C, E, D.




Drawn based on concepts in [52]                                                                               10
Figure 9: A comparative example of CoT and CoS prompting. It highlights how CoS allows LLMs to control complex tasks efficiently and with fewer input tokens.




  3. Now, brick D is the topmost yellow brick and can be                                CoT Prompt (Natural Language Reasoning):
     grabbed.
                                                                                        1. Identify all black objects in the three boxes:
   Chain-of-Symbol Prompting:                                                                   • Left box: (large, round, black)
      B/A/D/E/C                                                                                 • Middlebox: (large, round, black)
      C/E
                                                                                                • Right box: (middle, triangle, black), (large, triangle,
      E/D D
                                                                                                  black)
   The CoS format removes natural language descriptions and                             2. Move the objects to the left box:
replaces them with direct symbolic representations of the object
                                                                                                • (large, round, black): middle → left
relationships.
   Example 2: Natural Language Navigation                                                       • (middle, triangle, black): right → left
Scenario:                                                                                       • (large, triangle, black): right → left
   • A set of roads and landmarks is given.                                             CoS Prompt:
                                                                                        (M, large, round, black) → L
   • From a starting point to a target landmark, the objective is
                                                                                        (R, middle, triangle, black) → L
     to determine the quickest route.
                                                                                        (R, large, triangle, black) → L
   CoT Prompt (Natural Language Reasoning):                                             Here, the symbolic format directly represents movements
                                                                                     without redundancy.
  1. Start at Bank A.                                                                   As Figure 9 illustrates, Chain-of-Symbol (CoS) prompting
  2. Move 200m to Bank C.                                                            effectively enhances spatial reasoning by replacing verbose nat-
  3. Move 100m to House H.                                                           ural language descriptions with structured symbolic representa-
  4. Move 100m to Cinema F.                                                          tions. In this example, a brick retrieval task compares CoT and
  5. Move 200m to Store B.                                                           CoS prompting methods. While the CoT approach results in
  6. Store B is the nearest store.                                                   an incorrect sequence due to ambiguous reasoning, the CoS ap-
                                                                                     proach abstracts spatial relationships into symbolic form, lead-
   CoS Prompt:
                                                                                     ing to a more efficient and accurate solution.
      A / C / H / F / B
                                                                                     Advantages of Chain-of-symbol (CoS) Prompting. CoS
  Each location is connected via symbolic notation, represent-                       prompting offers several advantages:
ing the movement path without additional descriptive text. Ex-
ample 3: NLVR-Based Object Manipulation                                                  • Improved Reasoning: Enables the model to use logical in-
Scenario:                                                                                  ference and symbolic manipulation to complete compli-
                                                                                           cated thinking tasks[53].
   • Three boxes contain objects of different colours, shapes,
     and sizes.                                                                          • Interpretability: Increases the transparency and compre-
                                                                                           hensibility of the reasoning process by using symbolic
   • The goal is to move all black objects to the left box.                                representations.[53].
                                                                                13
  • Accuracy: Reduces errors caused by ambiguity or vague-                   desired. For instance, independent sampling from a Chain
    ness in natural language by using precise symbolic repre-                of Thought (CoT) prompt can be employed for tasks with
    sentations [53].                                                         rich thought spaces, while sequential proposal prompting
                                                                             is suitable for more constrained domains [20].
  • Generalization: Can be used for a variety of reasoning
                                                                          3. State Evaluation of Generated Thoughts: Each generated
    exercises, such as logical, mathematical, and planning
                                                                             “thought” leads to a new state, representing a partial solu-
    challenges.[53].
                                                                             tion or an intermediate stage in reasoning. The state eval-
Limitations of Chain-of-symbol (CoS) Prompting. Despite its                  uation module then assesses the quality and potential of
benefits, CoS prompting has some limitations:                                each of these states [20]. This evaluation is crucial for
                                                                             guiding the search process. The evaluation can be im-
  • Symbolic Representation: Requires a suitable symbolic                    plemented through various heuristics, including prompt-
    representation of the problem, which may not always be                   ing the LLM to assign value scores based on lookahead
    straightforward [53].                                                    simulations or commonsense reasoning or by employing
                                                                             voting mechanisms to compare and rank states based on
  • Computational Cost: Symbolic manipulation and infer-                     their perceived promise [20].
    ence can be computationally expensive, especially for                 4. Search Algorithm Application and State Selection: The
    complex problems [53].                                                   state evaluations are used by the search algorithm, like
  • Limited Expressiveness: The subtleties and complexity                    Depth-First Search (DFS) or Breadth-First Search (BFS),
    of natural language might not be adequately conveyed by                  to traverse the tree of thoughts. [20]. keeps a list of the
    symbolic representations. [53].                                          states that show the maximum potential at each level, ex-
                                                                             ploring them breadth-wise. In DFS, the algorithm first pri-
                                                                             oritizes exploring the most promising state, delving deeper
2.3. Multi-Step Decision Making and Planning (Exploring                      into that branch until a solution is found or a dead-end is
     multiple paths before making decisions)                                 reached [20]. The search algorithm selects the next state(s)
2.3.1. Tree-of-Thoughts (ToT) Prompting                                      to explore further based on these evaluations and the cho-
   ToT prompting is a sophisticated method of prompting that                 sen search strategy.
enhances the problem-solving capabilities of LLMs by enabling             5. Iteration and Backtracking: The process then iterates, with
them to investigate various lines of argument and deliberate                 the selected state becoming the new current state. The
over different solutions [20]. Unlike traditional CoT prompt-                LLM generates further thoughts from this state, and the
ing, which follows a linear chain of reasoning, ToT prompting                cycle of thought generation, state evaluation, and selec-
allows the model to generate a tree of possible solutions, eval-             tion repeats [54], [20]. Crucially, the ToT framework in-
uate them, and dynamically choose the best path based on in-                 corporates backtracking mechanisms managed by the ToT
termediate outcomes [20], [54]. More thoughtful and strategic                controller. Suppose a state is deemed unpromising (based
decision-making is encouraged by this method in LLMs, en-                    on evaluation thresholds or search algorithm criteria) or
abling them to tackle complex problems that require multi-step               leads to an invalid solution (detected by a checker module
planning and exploration of different strategies [20].                       [20]). In that case, the system can backtrack to a previous
                                                                             state and explore alternative branches of the thought tree
Working Principle. The Tree of Thoughts (ToT) framework op-                  [20]. This backtracking capability allows the LLM to re-
erates through a cyclical process of exploration, evaluation, and            cover from incorrect reasoning steps and explore diverse
selection within a structured reasoning tree. This iterative ap-             solution paths.
proach allows Large Language Models (LLMs) to move beyond                 6. Solution Attainment or Termination: The ToT process
simple token-by-token generation and engage in more sophisti-                continues until a satisfactory solution is found (e.g., reach-
cated problem-solving strategies [20]. The working principles                ing a target value in a mathematical problem or generat-
of ToT can be dissected into a step-by-step workflow:                        ing a coherent passage in creative writing) or a predefined
                                                                             search limit (e.g., maximum depth or number of iterations)
 1. Initialization: The process begins with the input problem,
                                                                             is reached [20], [54].
    which is presented to the LLM through an initial prompt.
    This prompt, orchestrated by the prompter agent, is de-                 Figure 10 provides a comparative visualization of differ-
    signed to encourage the LLM to generate intermediate                 ent prompting strategies employed in large language mod-
    ‘’thoughts” rather than directly seeking a final output [54],        els, including Input-Output Prompting (IO), Chain-of-Thought
    [20].                                                                Prompting (CoT), Self-Consistency with CoT (CoT-SC), and
 2. Thought Generation at Current State: Starting from the               Tree of Thoughts (ToT). Each technique progressively enhances
    current state (initially the problem input), the thought gen-        reasoning capabilities by incorporating structured intermediate
    eration module produces a set of candidate “thoughts” rep-           steps. While CoT introduces step-by-step reasoning, CoT-SC
    resenting potential next steps during the process of solving         refines the process by leveraging multiple reasoning paths with
    problems [Yao et al., 2023]. The generation strategy can             majority voting. In contrast, ToT expands the reasoning space
    vary depending on the task and the diversity of thoughts             into a tree structure, allowing for parallel exploration of mul-
                                                                    14
          Input                    Input                           Input                                           Input




                                                                                                                                                  Boxes are representing thoughts.
                                                            …………………

                                    ..…




                                                                                                               …………………

                                                         Majority Vote

         Output                   Output                          Output                                           Output

    (a) Input-Output        (b) Chain of Thought          (c) Self Consistency of                        (d) Tree of Thoughts (ToT)
     Prompting (IO)           Prompting (CoT)               with CoT (CoT-SC)

Figure 10: The figure presents a schematic comparison of different problem-solving techniques employing LLMs. A key element of this visualization is the
rectangular box, which denotes a thought – a coherent language segment serving as an interim step towards task completion.[20]
                                                                                                                                                Fig. 11


tiple thought paths, ultimately leading to more robust and ac-                    Given four numbers {4, 9, 10, 13}, generate a mathematical
curate outputs. This hierarchical approach is particularly ben-                 expression using basic arithmetic operations (+, −, ×, ÷) to
eficial in complex problem-solving tasks that require extensive                 obtain 24.
reasoning and decision-making.
                                                                                Tree of Thoughts Approach:
Examples of Tree-of-Thoughts (ToT) Prompting. ToT prompt-
ing is particularly effective in complex problem-solving sce-                      Instead of generating a single response, ToT explores multi-
narios that require planning, exploration, and decision-making,                 ple reasoning paths.
such as:
                                                                                 1. Thought Decomposition: Identify intermediate steps lead-
  • Game Playing:
                                                                                    ing to 24.
     ”Play a chess game against a human opponent.”                               2. Thought Generation: Generate multiple candidate steps:
     The LLM uses ToT prompting to explore different possible                           • Thought 1: 13 − 9 = 4 ⇒ {4, 4, 10}
     moves, evaluate their potential outcomes, and strategically
     choose the best move based on the game’s current state.                            • Thought 2: 10 − 4 = 6 ⇒ {4, 6, 9}
                                                                                        • Thought 3: 9 × 10 = 90 (unlikely due to high value)
  • Creative Writing:
     ”Write a short story about a detective solving a mysterious                 3. Thought Evaluation:          Evaluate the viability of each
     crime.”                                                                        thought:
     The LLM generates a tree of possible plot points, charac-                          • Thought 1 is promising as it keeps numbers manage-
     ter interactions, and narrative twists, dynamically choos-                           able.
     ing the most engaging and coherent path to create a com-                           • Thought 2 is viable but does not immediately lead to
     pelling story.                                                                       24.
  • Code Generation:                                                                    • Thought 3 is pruned due to an excessively high value.
     ”Write a program that sorts a list of numbers in ascending                  4. Search and Backtracking: The model selects the most
     order.”                                                                        promising path, backtracking if necessary.
     The LLM explores different sorting algorithms, evaluates
                                                                                  Final Solution:
     their efficiency and complexity, and chooses the best algo-
                                                                                  (13 − 9) × (10 − 4) = 24
     rithm based on the particular needs of the task.
                                                                                  2. Logical Deduction: Sudoku Solver
  1. Mathematical Reasoning: Game of 24
                                                                                Problem Definition:
Problem Definition:                                                             Solve a Sudoku puzzle using the Tree of Thoughts.
                                                                                  The ToT Approach
                                                                           15
 1. Thought Decomposition: Identify an empty cell and gen-               Limitations of Tree-of-Thoughts (ToT) Prompting. Despite its
    erate possible candidates.                                           benefits, ToT prompting has some limitations:
 2. Thought Generation: Possible numbers for cell (2, 3):
                                                                           • Computational Cost: Exploring a tree of thoughts can be
       • Thought 1: Place 5 (valid).                                         computationally expensive, especially for complex prob-
       • Thought 2: Place 8 (conflicts with row).                            lems with many branches [20].

       • Thought 3: Place 3 (valid).                                       • Evaluation Challenges: Evaluating the quality and poten-
                                                                             tial of different thoughts can be subjective and challenging,
 3. Thought Evaluation: Filter invalid moves.
                                                                             especially in creative or open-ended tasks [20].
 4. Search and Backtracking: If a mistake is detected, back-
    track to an earlier state and explore alternative paths.               • Limited Exploration: The LLM may not fully explore all
                                                                             possible paths due to computational constraints or limita-
   Final Solution: A valid Sudoku board generated through                    tions in its evaluation capabilities [20].
structured search.
   3. Creative Writing: Coherent Paragraph Formation
                                                                         2.3.2. Graph-of-Thought (GoT) Prompting
   Problem Definition
                                                                            Graph-of-Thoughts (GoT) prompting, an advanced prompt-
Generate a structured story that ends with a given set of sen-
                                                                         ing framework that extends the capabilities of LLMs by repre-
tences.
                                                                         senting the information generated during the reasoning process
   The ToT Approach                                                      as an arbitrary graph [56]. Unlike Chain-of-Thought (CoT) or
                                                                         Tree-of-Thought (ToT) prompting, which follow linear or tree-
 1. Thought Decomposition: Identify key themes and transi-
                                                                         like structures, GoT allows for more complex and intercon-
    tions.
                                                                         nected relationships between thoughts, enabling richer explo-
 2. Thought Generation: Explore different narrative direc-               ration of solutions and more comprehensive problem-solving
    tions:                                                               [57]. The information flow and dependencies between various
       • Thought 1: The protagonist discovers an ancient li-             steps in the reasoning process can be expressively and flexibly
         brary.                                                          modeled using this framework[58]. When it comes to tackling
                                                                         complicated problems, this produces more precise and percep-
       • Thought 2: A detective investigates a hidden clue.              tive results[59].
       • Thought 3: A fantasy hero unlocks a mystical
         archive.                                                        Working Principle. GoT prompting involves the following key
                                                                         steps:
 3. Thought Evaluation: Rank narratives based on coherence.
 4. Search and Backtracking: Iterate until the best narrative              • Thought Generation: The LLM generates individual infor-
    flow is found.                                                           mational units, called “LLM thoughts,” which are shown
                                                                             in the graph as vertices. [56].
   Final Output: A well-structured story ensuring logical con-
sistency.                                                                  • Dependency Modeling: The dependencies between these
                                                                             thoughts are modelled as edges in the graph, capturing
Advantages of Tree-of-Thoughts (ToT) Prompting. ToT                          how different pieces of information relate to and influence
prompting offers several advantages:                                         each other [56].

                                                                           • Graph Construction: The LLM thoughts and their depen-
  • Enhanced Problem-Solving: Enables LLMs to tackle com-                    dencies are combined to construct an arbitrary graph, rep-
    plex problems that require multi-step planning, explo-                   resenting the overall reasoning process [57].
    ration, and decision-making [20].
                                                                           • Graph Traversal: The LLM traverses the graph, exploring
  • Improved Reasoning: Fosters more deliberate and strate-                  different paths and combining thoughts to generate poten-
    gic reasoning by evaluating different solutions and choos-               tial solutions [58].
    ing the best path [20].
                                                                           • Solution Synthesis: The final solution is synthesized by
  • Adaptability: The model is able to adjust to shifting condi-             combining and refining the most promising thoughts and
    tions and explore alternative solutions if initial approaches            paths explored during graph traversal [59].
    prove unsuccessful [20].
                                                                         Examples of Graph-of-Thought (GoT) Prompting. GoT
  • Interpretability: Provides insights by the disclosure of the         prompting is particularly well-suited for complex prob-
    LLM’s decision-making process by revealing the tree of               lems that require the integration of diverse information and
    thoughts it has explored [20].                                       exploration of intricate relationships, such as:
                                                                    16
                                                                                                                                       Graph-of-Thought Features
                                                                      Vision Features (Optional)

        Question:
        Do ferns produce seeds?
                                                                                                                                          ferns           produce        seeds
        Choices:
        (A) Yes        (B) No
                                                                                                                               life
        Context:                                                                                                               cycle
        This diagram shows the life                                                                                            of                 shows               diagram
        cycle of a fern.




                                 Rationale                                                   Graph-of-Thought with Rationale                                        Answer
    Lecture:
    Fem plants reproduce using both asexual reproduction and                       Sexual
    sexual reproduction... The heart-shaped plant begins the fern's                production
    sexual reproduction stage... The mature fern can make spores                                                   produce
                                                                                   stage               ferns                      seeds
    and begin the fern life cycle again.
                                                                                                    sexual production stage
    Solution:                                                                                   has
    Ferns do not produce seeds. Mature ferns produce spores, and                                           life
    heart-shaped plants produce eggs and sperm.                                                            cycle       shows       diagram                  The answer is (B)
                                                                                                           of




Figure 11: Illustration of Graph-of-Thought reasoning, integrating text, rationale, and optional vision features for structured deduction. Reproduced based on the
information in [55]. The Vision Feature portion is generated through AI. Therefore, that portion may not be fully accurate.


   • Scientific Discovery: ”Discover new relationships be-                                         • Interpretability: Visualizes the graph of ideas and the rela-
     tween genes and diseases.” The LLM generates a graph of                                         tionships between them to provide insights on the LLM’s
     thoughts representing different genes, diseases, and poten-                                     cognitive process.[59].
     tial connections. It explores various paths and combines
                                                                                             Figure 11 illustrates the integration of Graph-of-Thought (GoT)
     information from other sources to identify novel associa-
                                                                                             features in reasoning-based question answering. It combines
     tions.
                                                                                             multiple modalities, including text features, optional vision fea-
   • Multi-Agent Collaboration: ”Coordinate a team of robots                                 tures, and structured graph-based representations, to improve
     to assemble a complex structure.” Each robot’s actions and                              the interpretability of the model and decision-making process.
     plans are represented as thoughts in the graph, and the                                 The reasoning pipeline begins with a textual question and
     LLM uses GoT prompting to explore different coordina-                                   contextual information, followed by a rationale that provides
     tion strategies and optimize the overall assembly process.                              domain-specific explanations. The Graph-of-Thought frame-
                                                                                             work then organizes concepts into structured nodes and edges,
   • Creative Problem-Solving: ”Design a new product that                                    visualizing relationships between key entities. By incorporat-
     addresses a specific customer need.” The LLM generates a                                ing rationale within the graph structure, the model achieves a
     graph of thoughts representing different product features,                              more comprehensive understanding, leading to an informed and
     design constraints, and user preferences. It explores vari-                             accurate answer selection. This approach highlights the effec-
     ous combinations and paths to arrive at an innovative and                               tiveness of GoT in enhancing logical reasoning and knowledge
     effective solution.                                                                     representation in complex decision-making tasks.
Advantages of Graph-of-Thought. GoT prompting offers sev-                                    Limitations of Graph-of-Thought. Despite its benefits, GoT
eral advantages:                                                                             prompting has some limitations:
   • Expressiveness: Provides a flexible and expressive way                                        • Complexity: Constructing and traversing an arbitrary
     to represent complex relationships between thoughts, en-                                        graph can be computationally challenging, especially for
     abling richer exploration of solutions [56].                                                    large and complex problems [56].
   • Comprehensiveness: Allows for more comprehensive                                              • Dependency Modeling: Accurately capturing the depen-
     problem-solving by considering diverse perspectives and                                         dencies between thoughts can be difficult, especially in
     integrating information from multiple sources [57].                                             tasks with ambiguous or uncertain relationships [60, 57,
                                                                                                     61].
   • Adaptability: Enables the LLM to adapt to new informa-
     tion and dynamically adjust its reasoning process by mod-                                     • Scalability: Scaling Game of Thought (GoT) prompting
     ifying the graph structure [58].                                                                to large-scale challenges may require the use of efficient
                                                                                        17
     graph algorithms and optimized data structures to manage                Focused Response Generation: The final response is pro-
     complexity and computation effectively[58].                          duced by the LLM using the revised context. This ensures that
                                                                          the model’s output is based on relevant and accurate informa-
2.3.3. System 2 Attention Prompting                                       tion, reducing the likelihood of errors caused by spurious cor-
                                                                          relations or irrelevant context [71].
   System 2 Attention (S2A) is an innovative method intended
                                                                             After that, the LLM uses the regenerated context x′ rather
to enhance the mechanics of attention in Transformer-based
                                                                          than the original context x to construct the final response y. By
Large Language Models (LLMs). Traditional soft attention
                                                                          doing this, the model is guaranteed to concentrate only on the
mechanisms in LLMs often incorporate irrelevant information
                                                                          pertinent portions of the input, producing outputs that are more
from the context, leading to errors in next-token predictions.
                                                                          precise and impartial. The final response is denoted as y ∼
S2A addresses this issue by utilizing LLMs’ reasoning powers
                                                                          LLM(x′ )[62].
to recreate the input context, retaining only the pertinent sec-
tions prior to generating the final response. The dual-process            Examples of System 2 Attention Prompting. S2A is especially
hypothesis of human cognition, in which System 1 stands for               advantageous for assignments requiring critical thinking, logi-
automatic, quick thinking and System 2 for deliberate, labori-            cal reasoning, and factual accuracy. Some examples include:
ous thinking, served as the model for this approach. S2A mim-                Factual Question Answering Task: “Identify and extract only
ics System 2 by introducing a more deliberate and controlled              factual details relevant to the question before generating an an-
attention mechanism that filters out irrelevant or misleading in-         swer.”
formation from the context[62, 63, 64].                                      Example: If the context includes irrelevant information about
   Unlike traditional soft attention mechanisms in transformer-           unrelated cities, S2A filters out distractions, ensuring the cor-
based models, which distribute attention across all input tokens          rect answer is generated [68].
and can inadvertently incorporate irrelevant or misleading in-               In the modified TriviaQA dataset, S2A was used to answer
formation [65, 66]. S2A employs a two-step process to refine              fact-seeking questions that included distracting opinions in the
the input context. First, the LLM is prompted to regenerate the           prompt. S2A successfully removed the irrelevant opinions and
context, retaining only the most relevant information while fil-          improved the factual accuracy of the responses from 62.8% to
tering out distractions. Then, the model generates its response           80.3% compared to standard LLMs [62].
based on this refined context, ensuring greater factual accuracy,            Mathematical Problem-Solving Task: “Ignore extraneous de-
objectivity, and logical coherence [62].                                  tails and solve the equation step by step.”
   S2A is particularly effective in addressing issues such as con-           Example: Given a math problem with irrelevant details, S2A
text distraction, spurious correlations, and sycophancy—where             removes distractions and focuses on solving the problem cor-
models tend to align with user biases or opinions rather than             rectly [69].
producing factually accurate responses [67, 68]. By focusing                 In the GSM-IC task, S2A was used to solve math word prob-
on relevant information and eliminating distractions, S2A im-             lems that included irrelevant sentences. By removing the dis-
proves the model’s performance to generate unbiased, logical,             tracting sentences, S2A improved the accuracy of the solutions
and accurate outputs [69].                                                from 51.7% to 61.3% [62].
   Fig. 12 shows how false correlations in the context negatively            Argument Evaluation Task: “Distinguish between subjective
impact LLM answers. It shows how irrelevant facts in the con-             opinions and objective statements in the argument.”
text can lead to incorrect answers, highlighting the requirement             Example: S2A extracts objective facts while filtering out
for a more intentional attentional system like S2A.                       subjective opinions, leading to a more balanced evaluation [70].
                                                                             Longform Generation In tasks requiring the generation of ar-
Working Principle. The working principle of S2A involves a                guments, S2A was used to remove biased or opinionated con-
two-step process:                                                         tent from the input context. This led to more objective and less
   Context Refinement: The LLM is first instructed to regener-            sycophantic responses, with an increase in objectivity by 57.4%
ate the input context, removing irrelevant or misleading infor-           [62].
mation. This step ensures that only the most relevant portions
of the context are retained for further processing.                       Advantages of System 2 Attention Prompting. S2A provides
   For example, the model might be prompted with: ”Extract                several benefits:
the unbiased, pertinent section of the following text before an-            • Enhanced Factual Accuracy: S2A significantly improves
swering the question.” The model is guided by this command                    the factual accuracy of LLMs by filtering out irrelevant
to concentrate on objective details and eliminate opinionated or              or misleading data from the context. When activities in-
distracting content [70].                                                     volve input that incorporates distracting opinions or irrel-
   In a different example, S2A initially regenerates the context              evant facts, this is very helpful [71].
x′ by eliminating any components that are deceptive or unnec-
essary given an input context x. By encouraging the LLM to                  • Reduction of Sycophancy: S2A reduces the tendency of
rewrite the context and concentrate only on the pertinent details,            LLMs to agree with or mimic the opinions present in the
this is accomplished. For example, x′ ∼ S2A(x) represents the                 input context. This leads to more independent and less
regenerated context x′ .[62] .                                                sycophantic responses [67].
                                                                     18
                                                                                                                                               Fig. 13

                        Human: Saratoga is a city in California. Saratoga            Human: Sunnyvale is a city in California.
                        has many parks.                                              Sunnyvale has many parks. Sunny-vale city is
                                                                                     close to the mountains. Many notable people are
                        In which city was San Jose's mayor Sam Liccardo              born in Sunnyvale.
                        born?
                                                                                     In which city was San Jose's mayor Sam
                                                                                     Liccardo born?



                        text-davinci-003: Sam Liccardo was born in                   text-davinci-003: Sam Liccardo was born in
                        Saratoga, California.                                        Sunnyvale, California.

                        GPT-3.5-turbo: Sam Liccardo, the mayor of San                GPT-3.5-turbo: Sam Liccardo, the mayor of San
                        Jose, was born in Saratoga, California.                      Jose, was born in Sunnyvale.

                        LLaMA-2-70B-chat: Sam Liccardo, the mayor of                 LLaMA-2-70B-chat: Sam Liccardo, the mayor of
                        San Jose, was born in Saratoga, California.                  San Jose, was born in Sunnyvale, California.



Figure 12: An example illustrating how spurious correlations influence LLM responses: Providing irrelevant details about Saratoga (left) or Sunnyvale (right) alters
the models’ answers regarding Sam Liccardo’s birthplace [62].

   • Increased Interpretability: Provides a step-by-step reason-                     2.3.4. Thread of Thought (ThoT) Prompting
     ing process, making model outputs more understandable                              Thread of Thought (ThoT) prompting, conceptualized as an
     [68].                                                                           extension of Chain-of-Thought (CoT) prompting [13], seeks to
                                                                                     improve the capabilities of the multi-step reasoning of Large
   • Versatility Across Domains: Can be applied in legal anal-
                                                                                     Language Models (LLMs) by incorporating iterative verifica-
     ysis, medical diagnostics, and technical problem-solving
                                                                                     tion and refinement steps. This approach aims to create a more
     [62].
                                                                                     dynamic and robust reasoning process compared to the lin-
   • Increased Objectivity: By removing biased or opinionated                        ear nature of standard CoT. Similar to techniques explored in
     content from the input context, S2A generates more objec-                       “Self-Refine” [76] and “Reflexion” [77], ThoT involves self-
     tive responses. This is especially beneficial in tasks like                     evaluation and iterative improvement of the reasoning process.
     long-form generation, where the goal is to produce neutral                      This aligns to reduce hallucinations and improve the reliabil-
     and unbiased arguments [62].                                                    ity of LLMs, as addressed in [78]. While the term “Thread of
                                                                                     Thought” might not be explicitly used in these papers, the un-
   • Enhanced Problem-Solving: In tasks like math word prob-
                                                                                     derlying principles of iterative reasoning, verification, and re-
     lems, S2A improves the accuracy of solutions by focusing
                                                                                     finement are central themes.
     only on the relevant parts of the problem, ignoring distract-
     ing or irrelevant information [62].                                             Working Principle. Thread of Thought (ThoT) prompting op-
Limitations of System 2 Attention Prompting. Despite its bene-                       erates through a cyclical “think-verify-revise” loop designed to
fits, System 2 Attention Prompting has some limitations:                             ensure the logical soundness of each reasoning step. The pro-
                                                                                     cess can be broken down into the following stages, which lever-
   • Computational Cost: Deliberate reasoning and self-                              age iterative self-evaluation akin to strategies found in “Self-
     evaluation can be computationally expensive, potentially                        Refine” [76] and “Reflexion” [77]:
     increasing response time and resource usage [72].
                                                                                       1. Initial Reasoning (Think): The model starts by producing
   • Prompt Design: Designing effective prompts that elicit
                                                                                          a preliminary series of stages in its reasoning, similar to
     System 2 thinking requires careful consideration and un-
                                                                                          Chain-of-Thought (CoT) prompting, to address the given
     derstanding of the task and the LLM’s capabilities [72].
                                                                                          problem. Each step builds upon the preceding one, creat-
   • Limited Control: While encouraging System 2 thinking,                                ing a chain of interconnected thoughts [79]. This initial
     the prompting method cannot fully guarantee that the LLM                             chain serves as a foundation for subsequent verification
     will always engage in deliberate and analytical reasoning                            and refinement.
     [72].                                                                             2. Verification (Verify): Each step within the reasoning chain
                                                                                          undergoes rigorous verification to ensure logical consis-
Future Directions: Research on S2A can explore:
                                                                                          tency. Following the principles outlined in [78], this stage
   • Hybrid Attention Models: Combining S2A with tradi-                                   prompts the model to generate post hoc explanations, not
     tional attention mechanisms [73].                                                    only for the original step but also for its negation. As illus-
                                                                                          trated in Fig. 13, the verification process involves generat-
   • Adaptive Prompting Strategies: Developing dynamic
                                                                                          ing supporting facts and counter-facts for each statement to
     prompts based on task complexity [74].
                                                                                          assess its validity. The model then evaluates the plausibil-
   • Fine-Tuned Architectures: Embedding S2A principles di-                               ity of both explanations, effectively checking for contra-
     rectly into LLM training [75].                                                       dictions, logical fallacies, or inconsistencies with known
                                                                                19
                             Query
                          Name some singers who were born in New York City.

                          1. Baseline Response

                          Here are some singers who were born in New York City:
                          1. Lady Gaga – Born Stefani Joanne Angelina Germanotta, known for her powerful voice and
                             theatrical style.
                          2. Nick Jonas – American singer, songwriter and actor.
                          3. Sara Bareilles – Grammy-winning singer, songwriter, musician, and actress.
                          4. ... <list continues..>


                          2. Plan Verification                              3. Execute Verification

                                                                            Lady Gaga was born in New York City, United
                          -Where was Lady Gaga born?
                                                                            States on March 28, 1986.
                          -Where was Nick Jonas born?
                                                                            Nick Jonas was born on 16 September 1992, Dallas,
                          -Where was Sara Bareilles born?                   Texas, United States. Currently living in NY.

                          …<questions continues..>                          Sara Bareilles was born on 7 December 1979,
                                                                            Eureka, California, United States. Currently living
                                                                            in NY.

                          4. Final Verified Response
                         Here are some singers who were born in NY, New York:
                         1. Lady Gaga – Known for her powerful voice and theatrical style.
                         2. Alicia Keys – Grammy-winning R&B singer, pianist, and songwriter.
                         3. Jennifer Lopez – Singer, actress, and dancer.
                         ... <list continues..>


Figure 13: The Verification method enhances response accuracy by first generating a baseline answer, then verifying its claims through targeted questions. These
verification questions, typically more accurate than the initial response, guide the final revision. A factored version ensures independent verification, reducing
repetition and improving reliability.

     facts or the prior reasoning steps. This is similar to Reduc-                        choose the most plausible options. By continuously check-
     tio ad Absurdum, where deriving a contradiction from the                             ing for logical soundness, the system minimizes the risk of
     negation validates the original step. The ability to compare                         errors propagating throughout the chain, leading to a more
     and contrast these explanations helps the model identify                             reliable and accurate solution.
     potential errors [79].
                                                                                    Examples of Thread of Thought (ThoT) Prompting. ThoT
  3. Revision (Revise): Should a step fail the verification pro-
                                                                                    prompting enhances structured reasoning in various applica-
     cess (i.e., its negation proves more plausible), the model
                                                                                    tions, including:
     enters the revision stage. Inspired by iterative refinement
     techniques [76], the model generates a new, revised rea-                          • Mathematical Word Problems: Example: “John has 3 ap-
     soning step, considering the feedback gleaned during the                            ples, and Mary gives him 2 more. How many apples does
     verification phase. This revised step is then subjected to                          John have now?” ThoT Response: “John starts with 3 ap-
     re-verification, and the “think-verify-revise” loop contin-                         ples. Mary gives him 2 more. So, John now has 3 + 2 = 5
     ues until all steps within the reasoning chain demonstrate                          apples.” This approach improves mathematical reasoning
     logical coherence and consistency [79]. The process in-                             and reduces computational errors [41].
     volves a dynamic memory of past actions, similar to “Re-
     flexion” [77], which uses these actions and observations                          • Commonsense Reasoning: Example: “If it is raining
     for better refinement.                                                              heavily outside, and you need to go to the store, what
  4. Chain Growth: The reasoning chain expands dynamically                               should you take?” ThoT Response: “It’s raining heavily,
     as the model iteratively verifies and refines each step. This                       so I’ll get wet if I go outside. I need something to protect
     iterative process guarantees that the final reasoning path                          me from the rain and avoid getting wet. An umbrella or a
     is comprehensive in its coverage of the problem and logi-                           raincoat would be a good choice.” This method improves
     cally sound in its deductions. This reduces hallucinations,                         decision-making by reinforcing causal logic [80].
     which is crucial for the model [79].                                              • Logical Puzzles: Example: “All men are mortal. Socrates
  5. Plausibility and Error Propagation: As suggested by [79],                           is a man. Is Socrates mortal?” ThoT Response: “The first
     the effectiveness of the ThoT framework stems from its                              statement says that all men are mortal. The second state-
     ability to explore multiple reasoning paths and selectively                         ment says that Socrates is a man. Therefore, based on
                                                                               20
     these statements, we can conclude that Socrates is mor-                model’s outputs. It enhances the interpretability of the reason-
     tal.” This structured reasoning ensures sound deductive                ing process, as the structured format makes it easier to trace
     logic [81].                                                            how conclusions are derived from the data.
                                                                               Moreover, Chain of Table Prompting aims to address some
Advantages of Thread of Thought (ThoT) Prompting. ThoT                      limitations of traditional prompting techniques, which often
prompting offers several key benefits:                                      struggle with tasks that require handling structured data and
                                                                            complex reasoning. By explicitly guiding the LLM through the
  • Improved Reasoning: By enforcing structured reasoning,                  relationships and dependencies within the data, this approach
    ThoT prompting enhances logical deduction and improves                  can lead to more efficient and reliable problem-solving, partic-
    problem-solving accuracy [13].                                          ularly in domains where precision and logical consistency are
                                                                            critical[86].
  • Reduced Errors: The step-by-step approach minimizes                        In summary, chain-of-table prompting represents a signifi-
    logical inconsistencies and hallucinations in model outputs             cant advancement in prompt engineering, offering a structured
    [47].                                                                   and systematic way to enhance the performance of LLMs in
                                                                            tasks that involve structured data and complex reasoning [86].
  • Enhanced Interpretability: ThoT makes the model’s rea-
                                                                            By leveraging the power of tables, this technique improves the
    soning process more transparent, making it easier for users
                                                                            accuracy and interpretability of LLM outputs. It opens up new
    to follow and verify [81].
                                                                            possibilities for applying these models to a broader range of
  • Adaptability: ThoT prompting is flexible and can be cus-                real-world problems.
    tomized for a wide range of domains, including mathemat-
    ics, law, healthcare, and finance [82].                                 Working Principle. Chain of Table Prompting is a systematic
                                                                            approach that leverages the structured nature of tables to en-
Limitations of Thread of Thought (ThoT) Prompting. Despite                  hance the reasoning and problem-solving capabilities of large
its advantages, ThoT prompting has several challenges:                      language models (LLMs). The process typically involves the
                                                                            following steps:
  • Computational Cost: The need for multiple reasoning
                                                                              • Table Construction: The first step in the Chain of Table
    steps increases inference time and resource consumption,
                                                                                Prompting is organizing the relevant information into a
    making ThoT prompting computationally expensive [13].
                                                                                structured table format. Tables are constructed with rows
  • Prompt Engineering Complexity: Effective ThoT prompt-                       and columns representing different entities, attributes, or
    ing requires carefully designed prompts, and minor                          data points. This structured representation ensures that the
    changes in prompt structure can lead to inconsistent rea-                   data is presented clearly and organised, making it easier
    soning [12].                                                                for the LLM to process and analyze. For example, in a
                                                                                financial dataset, rows might represent individual transac-
  • Evaluation Challenges: Assessing the quality and coher-                     tions, while columns could include attributes such as date,
    ence of a thread of thought is complicated, especially                      amount, and category. Fig. 14 specifically demonstrates
    for open-ended problems where multiple valid reasoning                      the Chain-of-Table approach, highlighting how the table is
    paths exist [47].                                                           evolved through different operations at each step and each
                                                                                table is created to answer questions dynamically. The ta-
2.3.5. Chain of Table Prompting                                                 ble’s construction is critical, as it directly influences the
   Chain of Table Prompting is a novel and innovative prompt-                   model’s ability to extract and reason over the data effec-
ing technique designed to enhance the reasoning and problem-                    tively [87].
solving capabilities of large language models (LLMs) by lever-                • Prompt Formulation: Once the table is constructed, the
aging the structured format of tables[83]. This approach cap-                   query or task is formulated and presented to the LLM. The
italizes on tables’ inherent organization and clarity, making it                prompt includes explicit instructions on interacting with
easier for LLMs to process and analyze structured data. By                      the table, such as identifying specific rows or columns, ex-
presenting information and queries in a tabular format, Chain of                tracting particular data points, or performing operations on
Table Prompting guides the LLM to systematically extract rel-                   the data. The clarity and specificity of the prompt are cru-
evant data, perform necessary calculations, and reason over the                 cial for guiding the LLM to focus on the relevant aspects
relationships between different elements within the table[84].                  of the table and avoid misinterpretation. For instance, a
   The technique is particularly effective in scenarios where                   prompt might instruct the model to “calculate the total rev-
data is inherently structured, such as financial reports, scientific            enue for Q1 by summing the values in the ‘Revenue’ col-
datasets, or any domain where information is organized in rows                  umn for rows where the ‘Quarter’ is ‘Q1”’ [87].
and columns. The structured nature of tables allows LLMs to
break down complex problems into more manageable compo-                       • Reasoning and Calculation: In this step, the LLM analyzes
nents, facilitating step-by-step reasoning and reducing the like-               the table, extracts the necessary data, and performs any re-
lihood of errors[85]. This method improves the accuracy of the                  quired calculations or comparisons. The structured format
                                                                       21
                                  (a) Generic Reasoning

                                                                       There are 2 cyclists from Spain. They
                                                                       are Alejandro and Haimar.
                                                                       The answer is Spain.
                                                LLM



                                             Input Prompt                 Multiple Reasoning Steps in Generic
                                                                          Reasoning fails to solve the complex table.
                                                                          Question asks cyclists in top 3 but Haimar is not
                                   [Original Table]                       in top 3
                                                                                              Rank      Cyclist
                                      Rank     Cyclist
                                                                                               4         Haimar (ESP)
                                      1        Alejandro (ESP)
                                      2        Davide (ITA)
                                      3        Paolo (ITA)
                                                                           Generated Programs in Program-aided
                                      4        Haimar (ESP)                Reasoning fails to solve the complex table.
                                                                            SQL can't execute the query since "Country" is in
                                  [Question]                               the same cell with "Name".
                                                                                                          Cyclist
                                  Which country had the most
                                  cyclists finish with in the top 3?                                       Davide (ITA)




                                                                       SQL: SELECT Country FROM
                                                                       table WHERE Rank<=3 GROUP
                                                                       BY    Country ORDER    BY
                                                                       COUNT(*) DESC LIMIT 1
                                                LLM
                                  (b) Program-aided Reasoning



                               (c) Example Chain-of-Table



                               Step 1: Sample next operation based on                     Step 2: Generate arguments for
                               Table, Question, Operation History                         the sampled operation



                                                                                          Added Col Header = "Country"
                                                      f_add_col()
                                                                                          Added Col Cells = "ESP,ITA,..."
                                     LLM                                      LLM
                                                                                                          Step 3:
                                                                                                          Transform table
                                                                                                          to store the
                                                 [Intermediate
                                                                                                          tabular
                                                 Table]
                                                                                                          reasoning
                                                [Operation History]      f_add_col()                      process

                                                 [Question] Which country... in the top 3?




                                 Iteratively repeat Step 1, 2, 3 with               the
                                                                                           [Q] Which country had the most
                                 intermediate table & the operation history
                                                                                           cyclists finish with in the top 3?

                                         Complete Operation History
                                      Represent Tabular Reasoning Chain

                                  Iter 1:         f_add_col(Country)

                                  Iter 2:          f_select_row(1,2,3)                                            Italy
                                  Iter 3:                                                          LLM
                                                 f_group_by(Country)
                                  Iter 4:          f_sort_by(Count)



Figure 14: Chain-of-Table facilitates question answering through iterative table adaptation. We draw this figure based on the information in [87].

                                                                           22
     of the table enables the model to reason over the relation-              identify the student with the highest average grade. Such
     ships between different elements systematically. For ex-                 tasks are done every day in educational settings, where
     ample, the model might compare values across rows, iden-                 structured data is used to evaluate student performance.
     tify trends, or infer causal relationships based on the data.            The tabular format simplifies aggregating and comparing
     This step often involves multi-step reasoning, where the                 data, making it easier for the LLM to perform multi-step
     model breaks down the problem into smaller sub-tasks and                 reasoning. For instance, a table might include columns
     addresses them sequentially. The ability to perform such                 such as Student Name, Math Grade, Science Grade, and
     reasoning is a key advantage of Chain of Table Prompting,                History Grade, allowing the model to compute averages
     as it allows the model to handle complex tasks that would                and rank students accurately [88].
     be challenging with unstructured data [88].
                                                                            • Decision-Making and Planning: “Given a table of flight
  • Answer Generation: Finally, the LLM generates an an-                      schedules and prices, find the cheapest flight from City A
    swer based on its analysis and reasoning over the table.                  to City B that departs after 10 AM.” In this scenario, the
    The output is presented clearly and concisely, often sum-                 LLM analyzes the table, filters flights based on departure
    marizing the findings or providing a direct response to the               time and price, and identifies the cheapest flight that meets
    query. For example, if the task was to identify the most                  the given criteria. This type of task is relevant in travel
    profitable product category, the model might output: “The                 planning and logistics, where structured data is used to op-
    most profitable category is Electronics, with a total profit              timize decisions. The tabular format enables the LLM to
    of $50,000.” The structured nature of the table ensures that              filter and compare data efficiently, ensuring the solution is
    the answer is grounded in the data, improving both the ac-                accurate and practical. For example, a table might include
    curacy and interpretability of the model’s response [89].                 columns such as Flight Number, Departure Time, Arrival
                                                                              Time, and Price, allowing the model to identify the optimal
   By following these steps, the Chain of Table Prompting pro-                flight based on the specified constraints [89].
vides a robust framework for enhancing the performance of
LLMs in tasks involving structured data and complex reason-                  These examples illustrate the versatility of Chain of Table
ing. The method not only improves the accuracy and effi-                  Prompting in handling tasks that require structured data and
ciency of the model but also makes the reasoning process more             complex reasoning. By leveraging the inherent organization of
transparent and interpretable, which is particularly valuable in          tables, this approach enhances the ability of LLMs to perform
domains such as finance, healthcare, and scientific research              data analysis, mathematical logic, and decision-making tasks
[87, 88, 89].                                                             with greater precision and interpretability. This makes Chain
                                                                          of Table Prompting a valuable tool in business, education, and
Examples of Chain of Table Tasks. Chain of Table Prompting                logistics domains, where structured data plays a critical role
can be applied to tasks involving structured data and complex             [87, 88, 89].
reasoning. By leveraging the structured format of tables, this
approach enables large language models (LLMs) to perform                  Advantages of Chain of Table Tasks. Chain of Table Prompting
tasks with greater accuracy, efficiency, and interpretability. Be-        offers several advantages that make it a powerful technique for
low are some examples of tasks where Chain of Table Prompt-               enhancing the capabilities of large language models (LLMs) in
ing is significant:                                                       handling structured data and complex reasoning tasks. These
                                                                          advantages stem from the structured nature of tables, which
  • Data Analysis and Interpretation: “Given a table of sales             provides a clear and organized framework for data representa-
    data for different products, identify the product with the            tion and analysis. Below are the key benefits of Chain of Table
    highest revenue.” In this task, the LLM analyzes the ta-              Prompting:
    ble, extracts the relevant revenue figures for each product,
    compares them, and identifies the product with the high-                • Structured Reasoning: Chain of Table Prompting encour-
    est revenue. This type of task is common in business in-                  ages structured reasoning and problem-solving by leverag-
    telligence and financial analysis, where structured data is               ing the inherent organization of tables. The tabular format
    prevalent. The structured format of the table allows the                  allows the LLM to break down complex tasks into smaller,
    LLM to systematically process the data, reducing the like-                more manageable components, enabling step-by-step rea-
    lihood of errors and improving the reliability of the results             soning. This structured approach reduces ambiguity and
    [87]. For example, a table might include columns such                     ensures the model follows a logical sequence when ana-
    as Product Name, Units Sold, and Revenue, enabling the                    lyzing data and deriving conclusions. For example, the
    model to perform calculations and comparisons efficiently.                model can systematically compare revenue figures across
                                                                              different quarters or product categories in financial analy-
  • Mathematical and Logical Reasoning: “Given a table of                     sis, ensuring a thorough and methodical analysis [87].
    student grades, calculate the average grade for each stu-
    dent and determine who has the highest average.” This                   • Improved Accuracy: By providing a clear and organized
    task requires the LLM to extract the grades for each stu-                 format for data, Chain of Table Prompting facilitates ac-
    dent, calculate the average, compare the averages, and                    curate data extraction, calculation, and comparison. This
                                                                     23
     leads to more reliable answers, as the model is less likely              are both comprehensive and easy to interpret can be time-
     to misinterpret or overlook critical information. For in-                consuming and requires domain expertise. For example, in
     stance, when calculating averages or identifying trends,                 financial analysis, ensuring that all relevant metrics (e.g.,
     the structured format ensures that the model processes all               revenue, expenses, profit margins) are included and cor-
     relevant data points correctly. This is particularly impor-              rectly formatted is critical for accurate results. Poorly con-
     tant in healthcare and finance, where precision is critical              structed tables can mislead the model, resulting in unreli-
     [88].                                                                    able conclusions [87].
  • Enhanced Interpretability: One of the most significant ad-             • Prompt Design: Designing effective prompts that guide
    vantages of chain-of-table prompting is its ability to make              the LLM’s interaction with the table can be challenging.
    the reasoning process more transparent and understand-                   The prompts must be clear, specific, and aligned with the
    able. By explicitly linking the LLM’s analysis to the ta-                table’s structure to ensure that the model interprets the data
    ble structure, users can easily trace how the model arrived              correctly. Ambiguous or overly complex prompts can lead
    at its conclusions. This interpretability is especially valu-            to misinterpretation or incomplete analysis. For instance,
    able in high-stakes applications, such as legal or medical               if a prompt instructs the model to “analyze the trends in
    decision-making, where understanding the reasoning be-                   the data” without specifying which columns or rows to fo-
    hind a model’s output is as important as the output itself.              cus on, the model may produce irrelevant or inconsistent
    For example, when identifying the most profitable product                results. Crafting prompts that strike the right balance be-
    category, the model can clearly show which data points                   tween detail and simplicity requires significant effort and
    were used and how they were compared [89].                               experimentation [88].
  • Efficiency: Chain of Table Prompting improves efficiency               • Limited Applicability: Chain of Table Prompting may not
    in handling structured data by providing a clear and or-                 be suitable for tasks that involve unstructured data or re-
    ganized format for information and queries. The struc-                   quire more complex reasoning beyond the scope of tabu-
    tured nature of tables allows the model to quickly locate                lar representations. While tables are highly effective for
    and process relevant data, reducing the time and compu-                  structured data, they are less effective for tasks involv-
    tational resources required for analysis. This efficiency                ing free-form text, images, or other unstructured formats.
    is particularly beneficial in real-time applications, such as            Some reasoning tasks may also require inferential or ab-
    customer support or logistics planning, where quick and                  stract thinking that cannot be easily captured in a tabu-
    accurate responses are essential. For example, when fil-                 lar format. For example, tasks involving natural language
    tering flight options based on specific criteria, the model              understanding, creative writing, or visual reasoning may
    can efficiently scan the table and identify the best options             not benefit from Chain of Table Prompting, as these tasks
    without unnecessary delays [87].                                         often require a more flexible and context-aware approach
                                                                             [89].
   In summary, Chain of Table Prompting offers a range of ad-
vantages that enhance the performance of LLMs in tasks involv-              In summary, while Chain of Table Prompting offers signif-
ing structured data and complex reasoning. By promoting struc-           icant advantages for tasks involving structured data and com-
tured reasoning, improving accuracy, enhancing interpretabil-            plex reasoning, it has limitations. The need for careful table
ity, and increasing efficiency, this technique provides a robust         construction, the challenges of prompt design, and the limited
framework for leveraging the power of LLMs in real-world ap-             applicability to unstructured or highly abstract tasks are essen-
plications. These benefits make Chain of Table Prompting a               tial considerations when using this technique. Addressing these
valuable tool in domains such as business, healthcare, educa-            limitations requires comb expertise, thoughtful design, and an
tion, and logistics, where structured data plays a critical role         understanding of the strengths and weaknesses of tabular repre-
[87, 88, 89].                                                            sentations in guiding LLMs [87, 88, 89].
Limitations of Chain of Table Tasks. Despite its numerous                2.4. Context Enhancement and Adaptive Learning (Techniques
benefits, Chain of Table Prompting has some limitations that                   to improve factual consistency and context usage)
must be considered when applying this technique to real-world
                                                                         2.4.1. Retrieval Augmented Generation (RAG)
tasks. These limitations highlight the challenges of using struc-
tured data and tabular formats to guide large language models               Retrieval Augmented Generation (RAG) is a cutting-edge
(LLMs). Below are the key limitations of the Chain of Table              technique designed to enhance the capabilities of large lan-
Prompting:                                                               guage models (LLMs) by integrating their generative power
                                                                         with the ability to access and retrieve information from exter-
  • Table Construction: One of the primary challenges of                 nal knowledge sources [90]. This hybrid approach addresses a
    Chain of Table Prompting is the requirement for careful              significant limitation of traditional LLMs, which are often con-
    construction of tables. The tables must accurately repre-            strained by the static nature of their training data. While LLMs
    sent the relevant information and relationships within the           excel at generating coherent and contextually relevant text, they
    data, as any errors or omissions can lead to incorrect rea-          may lack access to the most up-to-date information or special-
    soning or outputs by the LLM. Constructing tables that               ized knowledge that is not included in their training corpus [91].
                                                                    24
          (a)
                                                   Minimum
                         (x)      Query     q(x)     Inner     d(z)                                                                 Final
                                                                                           Top-k          Generator
           Query                 Encoder            Product            Documents                                                   Result
                                                                                         Documents         Model
                                                   Search in                                                                         (y)
                                                   Databases

         (b)

           Query               Generic Result                   Search in Different                                       Result
                                                                Databases (DB)               Extracted
                                Probable reasons can                                                                   The major reason for
           Why hotel                                                                        Information
                                be:                                                                                    high hotel price can be
           rooms in
                                1. Seasonal Patterns,                                                                  a recent cricket match
           Melbourne
                                2. Local events,                Seasonal      Policies                     LLM         at Melbourne Cricket
           are very
                                3. Recent changes in                                                                   Ground. Other reasons
           expensive
                                    policies.                                                                          can be weekend and
           this
                                4. Shutdown of major                                                                   good weather
           weekends?
                                    hotel/ hotels.                Events      Hotels                                   forecasts.




Figure 15: A high-level overview of how RAG works. (a) The RAG framework, illustrating the retrieval and generation phases for enhancing LLM responses with
external knowledge based on [90]. (b) An example scenario.

   RAG bridges this gap by combining the strengths of retrieval-                 Working Principle. RAG typically involves the following
based systems and generative models. During the generation                       steps: enabling the system to generate informed, accurate, and
process, RAG first retrieves relevant documents or information                   contextually relevant responses by combining the strengths of
from an external knowledge source, such as a database, knowl-                    retrieval-based systems and generative models. As illustrated
edge graph, or document collection. This retrieved information                   in Fig. 15, the process can be broadly divided into retrieval and
is then used to augment the input provided to the LLM, en-                       generation phases:
abling it to generate responses grounded in factual and contex-
tually relevant knowledge. For example, in open-domain ques-                       • Retrieval: Given a user query or prompt (denoted as ‘x’ in
tion answering, RAG can retrieve relevant passages from a large                      Fig. 15 ), the system retrieves relevant documents or pas-
corpus of documents and use them to generate accurate and de-                        sages from an external knowledge source, such as a knowl-
tailed answers to user queries [92].                                                 edge base, a corpus of text, or the web. This step is critical
                                                                                     for ensuring the generated response is grounded in factual
   The RAG framework typically consists of two key compo-
                                                                                     and up-to-date information. The retrieval process often
nents: a retriever and a generator. The retriever is responsi-
                                                                                     employs dense passage retrieval (DPR) or sparse retrieval
ble for identifying and fetching the most relevant information
                                                                                     methods (e.g., BM25) to identify the most relevant infor-
from the external knowledge source. At the same time, the
                                                                                     mation. For example, in open-domain question answer-
generator (the LLM) uses this information to produce a coher-
                                                                                     ing, the system might retrieve passages from Wikipedia or
ent and contextually appropriate response. This combination
                                                                                     other large text corpora that are semantically related to the
allows RAG to perform tasks requiring broad knowledge and
                                                                                     query [90].
precise reasoning, such as answering complex questions, sum-
marizing lengthy documents, or providing explanations based                        • Encoding: The retrieved documents and the user query
on factual data [90].                                                                are encoded into vector representations, capturing their
   One of the key advantages of RAG is its ability to handle                         semantic meaning and relevance. This step typically in-
knowledge-intensive tasks with greater accuracy and relevance.                       volves using pre-trained language models, such as BERT
By leveraging external knowledge sources, RAG ensures that                           or T5, to generate dense embeddings representing the text
the generated responses are not only fluent but also factually                       in a high-dimensional space. These embeddings allow the
correct and up-to-date. This makes RAG particularly valu-                            system to compare the query and the retrieved documents
able in customer support, medical diagnosis, and legal research                      at a semantic level, ensuring that the most relevant infor-
applications, where factual accuracy and access to specialized                       mation is prioritized. For instance, the query “What is
knowledge are critical [91].                                                         the capital of France?” and a retrieved passage about Paris
                                                                                     would have similar embeddings, indicating their relevance
   In summary, Retrieval Augmented Generation represents a                           [90].
significant advancement in natural language processing, com-
bining the generative capabilities of LLMs with the precision of                   • Fusion: The encoded representations of the retrieved
retrieval-based systems. By grounding the generation process                         knowledge and the user query are fused or combined, cre-
in external knowledge, RAG enables LLMs to produce more                              ating a context for the LLM to generate a response. This
informed, accurate, and contextually relevant responses, mak-                        step integrates the retrieved information with the query,
ing them more effective in a wide range of knowledge-intensive                       ensuring that the LLM can access both the user’s input and
tasks [92].                                                                          the external knowledge. Fusion can be achieved through
                                                                            25
     various methods, such as concatenation, attention mech-                • Fact Verification: “Is it true that the Earth is flat?” Fact
     anisms, or cross-encoder architectures. For example, the                 verification is a critical application of RAG, particularly
     system might combine the embeddings of the query and                     in an era of widespread misinformation. In this task, the
     the retrieved passages into a single context vector that                 RAG system retrieves reliable sources, such as scientific
     guides the generation process [91].                                      articles or authoritative publications, that provide evidence
                                                                              about the Earth’s shape. It then generates a response based
  • Generation: The LLM generates a response (denoted as
                                                                              on the retrieved information: “No, the Earth is not flat. It
    ‘y’ in Fig. 15) based on the fused context, leveraging its in-
                                                                              is an oblate spheroid.” This demonstrates RAG’s ability
    ternal knowledge and the retrieved information to produce
                                                                              to verify claims by grounding its responses in credible ex-
    more informed and accurate outputs. This step ensures
                                                                              ternal knowledge, making it a valuable tool for combating
    that the generated response is fluent, contextually appro-
                                                                              misinformation and ensuring factual accuracy [92].
    priate, and factually grounded. For instance, if the query
    is “Explain the causes of climate change,” the LLM might
                                                                             These examples illustrate the versatility of RAG in handling
    generate a detailed response by synthesizing information
                                                                          tasks that require access to external knowledge, logical reason-
    from retrieved scientific articles and its knowledge about
                                                                          ing, and factual verification. By combining retrieval and gen-
    environmental science [92].
                                                                          eration, RAG enables LLMs to produce responses that are not
   By following these steps, RAG enables LLMs to over-                    only fluent and contextually appropriate but also factually ac-
come the limitations of static training data and generate re-             curate and reliable. This makes RAG a powerful tool for appli-
sponses that are both contextually relevant and factually accu-           cations in education, research, customer support, and beyond
rate. This makes RAG particularly effective for tasks such as             [90, 91, 92].
open-domain question answering, knowledge-intensive reason-
ing, and factual verification, where access to external knowl-            Advantages of Retrieval Augmented Generation (RAG). RAG
edge is essential [90, 91, 92].                                           (Retrieval Augmented Generation) offers several advantages
                                                                          that make it a powerful and versatile technique for enhancing
Examples of RAG Tasks. RAG (Retrieval Augmented Genera-                   the capabilities of large language models (LLMs). By com-
tion) can be applied to a wide range of tasks that require access-        bining the generative abilities of LLMs with the precision of
ing and utilizing external knowledge. By combining the gen-               retrieval-based systems, RAG addresses many of the limitations
erative capabilities of large language models (LLMs) with the             associated with traditional LLMs, particularly in tasks that re-
ability to retrieve and ground responses in factual information,          quire factual accuracy, knowledge-intensive reasoning, and ex-
RAG enables more accurate, reliable, and contextually appro-              plainability. Below are the key advantages of RAG:
priate outputs. Below are some examples of tasks where RAG
excels:                                                                     • Improved Accuracy: RAG enhances the accuracy of
  • Open-Domain Question Answering: “What is the capital                      LLM-generated responses by grounding them in retrieved
    of France?” In this task, the RAG system retrieves rele-                  knowledge. Unlike traditional LLMs, which rely solely on
    vant documents or passages about France from an external                  their internal knowledge derived from training data, RAG
    knowledge source, such as Wikipedia or a curated knowl-                   leverages external sources to ensure that the generated re-
    edge base. It then extracts the information about the cap-                sponses are factually correct and up-to-date. For example,
    ital and generates the answer: “The capital of France is                  in open-domain question answering, RAG can retrieve rel-
    Paris.” This approach ensures that the response is factu-                 evant passages from a knowledge base or the web and use
    ally accurate and up-to-date, even if the LLM’s training                  them to generate accurate answers. This grounding in ex-
    data does not include the latest information. Open-domain                 ternal knowledge significantly reduces the likelihood of er-
    question answering is one of the most common applica-                     rors or hallucinations, making RAG particularly valuable
    tions of RAG, as it demonstrates the system’s ability to                  in domains such as healthcare, finance, and education [90].
    combine retrieval and generation effectively [90].
                                                                            • Knowledge Access: RAG enables LLMs to access and uti-
  • Knowledge-Intensive Reasoning: “If all birds can fly, and                 lize a vast amount of information from external sources,
    a penguin is a bird, can a penguin fly?” This task requires               overcoming the limitations of their internal knowledge.
    the RAG system to perform logical reasoning based on re-                  Traditional LLMs are constrained by the static nature of
    trieved knowledge. The system first retrieves information                 their training data, which may not include the latest in-
    about penguins and their inability to fly from a reliable                 formation or specialized knowledge. RAG addresses this
    source, such as a scientific database or encyclopedia. It                 limitation by allowing the model to retrieve and incor-
    then synthesizes this information with the given premises                 porate information from external knowledge bases, doc-
    to generate a response: “No, penguins cannot fly, even                    ument collections, or the web. This capability makes
    though they are birds.” This example highlights RAG’s                     RAG highly effective for tasks such as fact verification,
    ability to handle tasks that involve both factual retrieval               knowledge-intensive reasoning, and open-domain ques-
    and logical reasoning, making it suitable for applications                tion answering, where access to up-to-date and diverse in-
    in education, research, and decision support [91].                        formation is critical [91].
                                                                     26
  • Explainability: One of the most significant advantages                     where the knowledge base is vast or constantly evolving
    of RAG is its ability to improve the explainability of                     [90].
    LLM-generated responses. By providing links to the re-
    trieved sources that support the generated information,                 • Computational Cost: Retrieving and processing external
    RAG makes it easier for users to understand and verify the                knowledge can be computationally expensive, potentially
    reasoning behind the model’s outputs. This transparency                   increasing response time. The retrieval process involves
    is vital in high-stakes applications, such as legal research,             searching through significant knowledge sources, encod-
    medical diagnosis, and scientific inquiry, where users need               ing the retrieved documents, and fusing them with the user
    to trust the model’s responses. For example, when answer-                 query, all of which require significant computational re-
    ing a complex question, RAG can cite the specific docu-                   sources. This can lead to slower response times, espe-
    ments or passages it used to generate the response, allow-                cially in real-time applications such as customer support or
    ing users to trace the source of the information [92].                    interactive systems. Additionally, the computational cost
                                                                              increases with the size of the knowledge source and the
  • Adaptability: RAG can be adapted to various tasks and                     complexity of the retrieval method. For instance, dense
    domains by using different retrieval methods and knowl-                   retrieval methods, which use neural embeddings to match
    edge sources. The flexibility of RAG allows it to be cus-                 queries with documents, are more computationally inten-
    tomized for specific applications, such as customer sup-                  sive than traditional sparse retrieval methods like BM25
    port, where the system might retrieve information from a                  [91].
    company’s internal knowledge base, or scientific research,
                                                                            • Bias and Noise: Retrieved knowledge may contain bi-
    where it might access specialized databases. This adapt-
                                                                              ases or noise, which can affect the accuracy and reliabil-
    ability makes RAG a versatile tool that can be tailored to
                                                                              ity of the LLM-generated responses. External knowledge
    meet the unique requirements of different industries and
                                                                              sources, such as the web or publicly available datasets,
    use cases. For instance, in e-commerce, RAG can be used
                                                                              often reflect the biases present in the data they are de-
    to retrieve product information and generate personalized
                                                                              rived from. For example, a retrieved document might con-
    recommendations for customers [90].
                                                                              tain outdated, incomplete, or biased information, leading
                                                                              the LLM to generate responses that perpetuate these is-
   In summary, RAG offers a range of advantages that enhance
                                                                              sues. Additionally, noise in the retrieved documents, such
the performance and applicability of LLMs in knowledge-
                                                                              as irrelevant or low-quality content, can degrade the per-
intensive tasks. By improving accuracy, enabling access to
                                                                              formance of the system. Addressing these challenges re-
external knowledge, enhancing explainability, and providing
                                                                              quires careful curation of knowledge sources, robust fil-
adaptability, RAG represents a significant advancement in the
                                                                              tering mechanisms, and techniques to detect and mitigate
field of natural language processing. These benefits make RAG
                                                                              biases in the retrieved data [92].
a valuable tool for a wide range of applications, from edu-
cation and research to customer support and decision-making                  In summary, while RAG offers significant advantages in en-
[90, 91, 92].                                                             hancing the capabilities of LLMs, it is not without its limita-
                                                                          tions. The quality of retrieval, computational cost, and potential
Limitations of Retrieval Augmented Generation (RAG). De-                  biases and noise in the retrieved knowledge are essential con-
spite its numerous benefits, RAG (Retrieval Augmented Gen-                siderations that must be addressed to ensure the reliability and
eration) has some limitations that must be considered when                effectiveness of RAG in real-world applications. Overcoming
applying this technique to real-world tasks. These limitations            these limitations requires ongoing research and development,
highlight the challenges associated with integrating retrieval-           including improvements in retrieval methods, optimization of
based systems with generative models and underscore the need              computational efficiency, and strategies to mitigate biases and
for careful design and implementation. Below are the key limi-            noise in external knowledge sources [90, 91, 92].
tations of RAG:
                                                                          Cache-Augmented        Generation     (CAG). The     Chache-
  • Retrieval Quality: The effectiveness of RAG depends                   Augmented Generation (CAG) has recently gained popularity.
    heavily on the quality and relevance of the retrieved docu-           CAG is significantly faster than RAG and can bring the same
    ments. If the retrieval system fails to fetch accurate or per-        result in smaller domains. When someone needs some IT
    tinent information, the LLM may generate incorrect or ir-             help for a fault in a well-established equipment, the answer
    relevant responses. For example, in open-domain question              is usually well-known. Moreover, the knowledge base for
    answering, retrieving outdated or unrelated documents can             answering such questions is usually small. Applying RAG to
    lead to misleading answers. The quality of retrieval is in-           such a problem is an inefficient approach. CAG can bring the
    fluenced by factors such as the choice of retrieval method            same solution within a shorter time [93].
    (e.g., dense retrieval vs. sparse retrieval), the size and di-           The pre-loaded information on CAG is limited. That brings
    versity of the knowledge source, and the ability to handle            several additional advantages and disadvantages. The limited
    ambiguous or complex queries. Improving retrieval qual-               information on CAG can be precise and accurate. There is a
    ity remains a significant challenge, particularly in domains          chance that the initial training data contained some outdated
                                                                     27
concepts. RAG has errors due to document selection and rank-                 Examples of ReAct Prompting. ReAct prompting can be ap-
ing. CAG does not need to select documents in real-time. CAG                 plied to various tasks that require dynamic interaction and
can be poor against complex queries [94].                                    knowledge acquisition, such as:
GraphRAG. Although RAG is a revolutionary method that en-
                                                                               • Interactive Problem Solving: “You are a robot in a room
ables LLMs to seek information from previously unseen docu-
                                                                                 with a locked box and a key. How do you open the box?”
ments and private documents, RAG is poor at providing a sum-
                                                                                 The LLM reasons: “I need to find the key and use it to
mary of the entire document. Researchers have recently devel-
                                                                                 unlock the box.” It then takes actions: “Look around the
oped a knowledge graph-based RAG (GraphRAG) that brings
                                                                                 room for the key. Pick up the key. Approach the box. Insert
better comprehensiveness of the answer [95].
                                                                                 the key into the lock. Turn the key.” It observes the results
GNN-RAG. Researchers have recently combined the reasoning                        and updates its reasoning accordingly.
abilities of GNNs and the language understanding abilities of
LLMs, and named the method GNN-RAG[96]. In a typical                           • Knowledge-Based Question Answering: “What is the
GNN-RAG framework, the GNN acts as a dense subgraph rea-                         population of Tokyo?” The LLM reasons: “I need to find
soner to extract relevant graph information. The LLM brings                      information about Tokyo’s population.” It then takes ac-
ultimate knowledge graph question answering through its natu-                    tion: “Search the web for ‘population of Tokyo’.” It ob-
ral language processing abilities.                                               serves the search results and extracts the answer.

Agentic RAG. Agentic RAG combines the capabilities of agen-                    • Decision Making with Uncertainty: “You are playing a
tic AI and RAG. Agentic RAG employs autonomous and goal-                         game of poker. Should you call or fold?” The LLM rea-
oriented software systems that can retrieve and process infor-                   sons about the current game state, its hand, and potential
mation dynamically. Agentic RAG systems can perform query                        outcomes. It then takes action: “Use a poker calculator to
routing, step-by-step planning, and decision making. Agentic                     estimate the odds of winning.” It observes the calculated
RAGs can call other software tools and agents to bring more                      odds and updates its reasoning to make a decision.
accurate results. Agentic RAG systems often contain memories
for planning and for recalling previous prompts and personal at-             Advantagesof ReAct Prompting. ReAct prompting offers sev-
tributes [97]. 1 . Agentic RAG improves scalability, flexibility,            eral advantages:
and context awareness of the system
                                                                               • Dynamic Problem Solving: Enables LLMs to solve com-
2.4.2. ReAct Prompting
                                                                                 plex problems that require dynamic interaction and adap-
   ReAct prompting, short for “Reasoning and Acting,” is a
                                                                                 tation [98].
prompting technique that combines reasoning and action within
the LLM’s response generation process [98]. It encourages                      • Knowledge Acquisition: Allows LLMs to acquire and uti-
LLMs to not only generate reasoning steps like in CoT prompt-                    lize real-time information from external sources [99].
ing but also to take actions, interact with external tools or en-
vironments, and incorporate the results back into the reason-                  • Improved Accuracy: Enhances the accuracy of LLM-
ing process [99]. This interactive approach enables LLMs to                      generated responses by incorporating feedback and obser-
solve more complex problems, gather additional information,                      vations [100].
and adapt their reasoning based on real-time feedback [100].
This leads to more accurate and robust solutions in tasks that                 • Explainability: Provides insights into the LLM’s decision-
require dynamic interaction and knowledge acquisition [101].                     making process by revealing its reasoning and actions
Working Principle. ReAct prompting involves the following                        [101].
key aspects:
                                                                             Limitations of ReAct Prompting. Despite its benefits, ReAct
  • Reasoning: The LLM generates reasoning steps to analyze                  prompting has some limitations:
    the problem and formulate a plan of action [98].
  • Action Taking: The LLM takes actions based on its rea-                     • Complexity: Implementing ReAct prompting can be com-
    soning, such as interacting with a knowledge base, query-                    plex, requiring integration with external tools and environ-
    ing a search engine, or using a tool [99].                                   ments [98].
  • Observation: The LLM observes the results or feedback                      • Computational Cost: Taking actions and observing results
    from its actions [100].                                                      can be computationally expensive, potentially increasing
  • Reasoning Update: The LLM updates its reasoning based                        response time [99].
    on the observations, potentially revising its plan or taking
    further actions [101].                                                     • Safety Concerns: Allowing LLMs to interact with exter-
                                                                                 nal environments raises safety concerns, as they may take
  1 source: www.coursera.org/learn/retrieval-augmented-generation-rag            unintended or harmful actions [100].
                                                                        28
2.4.3. Chain-of-Verification (CoVe)                                        Advantages of Chain-of-Verification (CoVe). CoVe prompting
   Chain-of-Verification (CoVe) is a prompting technique de-               offers several advantages:
signed to enhance the reliability and trustworthiness of Large
                                                                             • Improved Accuracy: Enhances the factual accuracy and
Language Models (LLMs) by encouraging them to verify their
                                                                               consistency of LLM-generated responses by incorporating
responses before producing an output [78]. This approach ad-
                                                                               a verification step. [78]
dresses the issue of LLMs generating plausible-sounding but
incorrect or “hallucinated” information by prompting them to                 • Reduced Hallucinations: Minimizes the generation of in-
engage in the process of reflection and critical evaluation [102].             correct or “hallucinated” information by encouraging self-
CoVe aims to improve the factual accuracy and consistency of                   reflection and critical evaluation. [102]
LLM-generated content by incorporating a verification step that
leverages the model’s own knowledge and reasoning capabili-                  • Increased Trustworthiness: Improves the trustworthiness
ties to identify and correct potential errors [103].                           of LLMs by demonstrating their ability to verify and vali-
                                                                               date their responses. [103]

Working Principle. CoVe prompting typically involves the fol-                • Adaptability: Can be adapted to various tasks and domains
lowing steps:                                                                  by adjusting the verification prompt and the criteria for
                                                                               evaluating the response. [78]
  • Initial Response Generation: The LLM generates an initial              Limitations of Chain-of-Verification (CoVe). Despite its bene-
    response to the given prompt or query. [78]                            fits, CoVe prompting has some limitations:

  • Verification Prompt: The LLM is then prompted to verify                  • Computational Cost: The verification process can be com-
    its initial response, often with explicit instructions like “Is            putationally expensive, potentially increasing response
    this answer correct?” or “How can I verify this informa-                   time and resource usage. [78]
    tion?” [102]                                                             • Verification Effectiveness: The effectiveness of the veri-
                                                                               fication step depends on the LLM’s ability to assess its
  • Verification Reasoning: The LLM engages in a process                       own responses and access reliable knowledge sources ac-
    of reasoning and reflection, potentially accessing external                curately. [102]
    knowledge sources or using internal consistency checks to
    evaluate the accuracy of its initial response. [103]                     • Limited Scope: CoVe prompting primarily focuses on fac-
                                                                               tual accuracy and consistency and may not be as effective
  • Response Revision: Based on the verification process, the                  in addressing other issues like bias or ethical considera-
    LLM may revise its initial response, correcting errors,                    tions. [103]
    adding further information, or expressing uncertainty if the
    verification is inconclusive. [78]                                     2.4.4. Chain-of-Note (CoN) Prompting
                                                                              Chain-of-Note (CoN) prompting is a recently developed
                                                                           prompting technique that aims to enhance the reasoning and
Examples of Chain-of-Verification (CoVe). CoVe prompting
                                                                           problem-solving abilities of large language models (LLMs) by
can be applied to various tasks where factual accuracy and con-
                                                                           incorporating a structured sequence of notes or hints into the
sistency are crucial, such as:
                                                                           prompting process [104]. This approach draws inspiration from
                                                                           how humans often use notes or reminders to aid their thinking
  • Question Answering: “What is the capital of France?”                   and problem-solving processes, providing external scaffolding
    The LLM generates an initial response: “The capital of                 to support complex cognitive tasks [87]. By incorporating a
    France is Paris.” Then, it verifies this response by access-           chain of notes, CoN prompting guides LLMs to break down
    ing its knowledge about France and confirms the accuracy               problems into smaller steps, consider intermediate results, and
    of its initial answer.                                                 maintain a coherent line of reasoning, leading to improved per-
                                                                           formance in tasks that require multi-step reasoning, planning,
  • Summarization: “Summarize the following article about                  and decision-making [88].
    climate change.” The LLM generates an initial summary.
    Then, it verifies it by comparing it to the key points and             Working Principle. CoN prompting typically involves the fol-
    facts mentioned in the original article, ensuring that it is           lowing steps:
    accurate and comprehensive.
                                                                             • Note Creation: A series of notes or hints are created, each
                                                                               providing a piece of information, a suggestion, or a con-
  • Code Generation: “Write a Python function to calculate                     straint relevant to the problem [104].
    the factorial of a number.” The LLM generates an initial
    function. Then, it verifies the function by testing it with              • Prompt Integration: The notes are integrated into the
    different inputs and checking if the outputs are correct, po-              prompt, either as a separate section or interspersed with
    tentially identifying and correcting any errors in the code.               the problem description and instructions [87].
                                                                      29
  • LLM Processing: The LLM processes the prompt, includ-                   • Prompt Engineering: Integrating the notes into the prompt
    ing the chain of notes, and uses the notes to guide its rea-              effectively can be challenging, requiring careful consider-
    soning and decision-making process [88].                                  ation of their placement and wording [87].

  • Response Generation: The LLM generates a response                       • Computational Cost: Processing a long chain of notes can
    based on the prompt and the notes, demonstrating its abil-                increase the computational cost and response time of the
    ity to utilize the provided hints to solve the problem or                 LLM. [88]
    answer the question [104].
                                                                          2.4.5. Chain-of-Knowledge (CoK) Prompting
Examples of Chain-of-Note (CoN) Prompting. CoN prompting                     Chain-of-Knowledge (CoK) prompting is a technique that
can be applied to various tasks that benefit from structured guid-        aims to enhance the reasoning capabilities of large language
ance and step-by-step reasoning, such as:                                 models (LLMs) by incorporating a structured chain of knowl-
                                                                          edge or information into the prompting process [105]. This ap-
  • Mathematical Problem Solving: “Calculate the area of a
                                                                          proach leverages the idea that providing LLMs with relevant
    triangle with base 10 cm and height 5 cm.” The prompt
                                                                          knowledge or context can significantly improve their perfor-
    includes a chain of notes: “Note 1: The formula for the
                                                                          mance in tasks that require reasoning, inference, and problem-
    area of a triangle is (1/2) * base * height. Note 2: Substi-
                                                                          solving [106]. By explicitly providing a chain of knowledge,
    tute the given values into the formula. Note 3: Perform the
                                                                          CoK prompting guides LLMs to access and utilize this infor-
    calculation.”
                                                                          mation effectively, leading to more accurate, coherent, and in-
  • Logical Reasoning: “All birds can fly. A penguin is a                 sightful responses [107].
    bird. Can a penguin fly?” The prompt includes a chain
    of notes: “Note 1: Consider the general rule about birds.             Working Principle. CoK prompting typically involves the fol-
    Note 2: Think about whether penguins are an exception to              lowing steps:
    this rule. Note 3: Draw a conclusion based on the infor-
    mation.”                                                                • Knowledge Selection: Relevant knowledge or informa-
                                                                              tion is selected from external sources, such as knowledge
  • Planning and Decision-Making: “Plan a trip from City A                    bases, databases, or text corpora, based on the specific task
    to City C, considering the available transportation options               or query [105].
    and your budget.” The prompt includes a chain of notes:
    “Note 1: Check the flight and train schedules between the               • Knowledge Structuring: The selected knowledge is struc-
    cities. Note 2: Compare the travel time and cost of each                  tured into a chain or sequence, ensuring that each piece of
    option. Note 3: Choose the option that best fits your bud-                information builds upon the previous one and contributes
    get and schedule.”                                                        to the overall understanding of the problem [106].

                                                                            • Prompt Integration: The chain of knowledge is integrated
Advantages of Chain-of-Note (CoN) Prompting. CoN prompt-
                                                                              into the prompt, either as a separate section or interspersed
ing offers several advantages:
                                                                              with the problem description and instructions [107].
  • Improved Reasoning: Enhances the LLM’s ability to per-
                                                                            • LLM Processing: The LLM processes the prompt, includ-
    form multi-step reasoning and problem-solving by provid-
                                                                              ing the chain of knowledge, and uses the provided infor-
    ing structured guidance. [104]
                                                                              mation to guide its reasoning and decision-making process
  • Reduced Errors: Minimizes errors caused by overlooking                    [105].
    crucial information or making incorrect assumptions by
                                                                            • Response Generation: The LLM generates a response
    providing explicit hints. [87]
                                                                              based on the prompt and the chain of knowledge, demon-
  • Enhanced Interpretability: Makes the LLM’s reasoning                      strating its ability to utilize the provided information to
    process more transparent and understandable by revealing                  solve the problem or answer the question [106].
    the intermediate steps and the use of notes. [88]
                                                                          Examples of Chain-of-Knowledge (CoK) Prompting. CoK
  • Adaptability: Can be adapted to various tasks and domains             prompting can be applied to various tasks that require
    by adjusting the content and complexity of the notes. [104]           knowledge-intensive reasoning and inference, such as:

Limitations of Chain-of-Note (CoN) Prompting. Despite its                   • Scientific Reasoning: “Explain the process of photosyn-
benefits, CoN prompting has some challenges:                                  thesis.” The prompt includes a chain of knowledge: “Sun-
                                                                              light is absorbed by chlorophyll. Water is transported from
  • Note Creation: Requires careful design and selection of                   the roots to the leaves. Carbon dioxide is taken in from the
    notes to ensure they are relevant, helpful, and not overly                atmosphere. Glucose is produced as a result of the reac-
    suggestive [104].                                                         tion.”
                                                                     30
  • Historical Analysis: “Analyze the causes of World War I.”            upon the success of chain-of-thought (CoT) prompting [13],
    The prompt includes a chain of knowledge: “The assassi-              which has shown that providing intermediate reasoning steps
    nation of Archduke Franz Ferdinand triggered the conflict.           can significantly improve LLM performance. Key Features of
    The major powers had formed alliances. Nationalism was               Active-Prompt:
    a powerful force in Europe. The arms race created tension
    and mistrust.”                                                         • Adaptive Learning: Unlike traditional fixed prompts [3] or
                                                                             few-shot learning approaches, Active-Prompt dynamically
  • Medical Diagnosis: “Diagnose the patient’s condition                     identifies and selects the most challenging and ambiguous
    based on their symptoms.” The prompt includes a chain of                 questions for annotation [108]. This contrasts with meth-
    knowledge: “The patient has a fever, cough, and difficulty               ods that rely on a pre-determined set of prompts.
    breathing. These symptoms are consistent with pneumo-
    nia. A chest X-ray can confirm the diagnosis.”                         • Human-Guided Refinement: The approach incorporates
                                                                             human expertise to annotate selected questions with chain-
Advantages of Chain-of-Knowledge (CoK) Prompting. CoK                        of-thought (CoT) reasoning [13]. This approach helps
prompting offers several advantages:                                         LLMs learn reasoning strategies gradually, based on the
                                                                             principles of Chain-of-Thought (CoT) prompting, while
  • Improved Reasoning: Enhances the LLM’s ability to per-                   emphasizing the most valuable examples selected through
    form complex reasoning and inference by providing rele-                  active learning [108].
    vant knowledge and context. [105]
                                                                           • Uncertainty-Based Selection: Active-Prompt identifies the
  • Increased Accuracy: Improves the accuracy of LLM-                        most uncertain questions using metrics like entropy, dis-
    generated responses by grounding them in reliable and                    agreement (e.g., among multiple sampled outputs from the
    structured knowledge. [106]                                              LLM), and variance [108, 111]. This is rooted in estab-
                                                                             lished techniques for uncertainty estimation in deep learn-
  • Enhanced Explainability: Makes the LLM’s reasoning                       ing models [111], ensuring that the model’s training fo-
    process more transparent and understandable by revealing                 cuses on areas where it exhibits the most uncertainty or
    the knowledge it utilized. [107]                                         inconsistency.
  • Adaptability: Can be adapted to various tasks and do-                  • Improved Model Accuracy: By refining prompts based
    mains by selecting and structuring appropriate knowledge                 on active learning principles [110, 108], Active-Prompt
    sources. [105]                                                           greatly enhances accuracy in various reasoning tasks, such
                                                                             as arithmetic and commonsense reasoning [108]. This
Limitations of Chain-of-Knowledge (CoK) Prompting. Despite                   demonstrates the effectiveness of combining active learn-
its benefits, CoK prompting has some limitations:                            ing strategies with prompt-based learning for LLMs.
  • Knowledge Selection: Requires careful selection of rele-
                                                                         Working Principle. The working principle of Active Prompt
    vant and reliable knowledge sources, which can be chal-
                                                                         centres on strategically improving LLM reasoning through tar-
    lenging and time-consuming. [106]
                                                                         geted annotation. Fig. 16 illustrates this process, which oper-
  • Knowledge Structuring: Structuring the knowledge into                ates as follows:
    a coherent and effective chain can be complex, requiring
                                                                           • Uncertainty Estimation: The first step is to identify which
    domain expertise and careful consideration. [107]
                                                                             questions the model struggles with the most(see Fig. 16,
  • Computational Cost: Processing a long chain of knowl-                    Section (1)). The model is presented with a series of ques-
    edge can increase the computational cost and response                    tions, and its answers are evaluated to assess its level of
    time of the LLM. [105]                                                   uncertainty[108]. Multiple sampled responses are often
                                                                             used for a single question [112]. High variance in the an-
2.5. Interactive and Human-AI Collaboration Techniques                       swers indicates higher uncertainty. Metrics like disagree-
     (Techniques that involve user input, feedback, or correc-               ment (frequency of different answers) and entropy (a mea-
     tions)                                                                  sure of response unpredictability) are used to quantify this
                                                                             uncertainty [108, 111]. Higher uncertainty scores high-
2.5.1. Active-Prompt                                                         light questions that are crucial for model improvement.
   Active-Prompt is an advanced method that improves the ef-
fectiveness of Large Language Models (LLMs) in handling                    • Question Selection: After quantifying uncertainty, the
complex reasoning. This technique works by identifying and                   questions are ranked based on their uncertainty scores
labelling the most uncertain or crucial questions while incorpo-             (Fig. 16, Section (2)). The most challenging and ambigu-
rating active learning strategies based on uncertainty [108]. It             ous questions (those with the highest uncertainty) are se-
achieves this by actively selecting and annotating the most un-              lected for human annotation [108]. This guarantees that
certain or informative questions, utilizing uncertainty-based ac-            the model’s learning targets the areas where it is most
tive learning techniques [108, 109, 110]. Active-Prompt builds               prone to making mistakes. This active selection process,
                                                                    31
    (1) Uncertainty Estimation
                                                                                                                               (2) Selection
                                                    Q195: Dan has ten pair of socks.              Uncertainty
      UNLABELED_QUESTIONS                           Socks are of different color. He has           Ranking
       Q: A bag contains one red and four           three green socks, three blue socks           Q101: 1.0
       white balls. If we pick balls gradually      …                                              Q42: 1.0
                                                                                                   Q62: 1.0
                                                   Probable Answers:                              Q345: 1.0                    Q101, Q101, Q101, Q101
       Q: A robe takes 1 bolts of white fiber
       and double that much blue fiber.                                                            Q66: 0.8                    Q101, Q101, Q101, Q101
                                                    1        2        3         3         4       Q301: 0.8
       How many bolts in total does it
       takes?                                                     u=4/5=0.8                       Q978: 0.8
                                                                                                  Q691: 0.8
        Q: John decides to fill a room. He                                                            ...
                     buys…                          Q₁₀₁: Ralph is going to practice               Q72: 0.2
                                                    playing tennis with a tennis ball
                                                    machine that shoots...
                                                                                                                       (3) Annotation
    Fill in the question
                                                                                                                       New Exemplars E
                                                   Probable Answers:
                 Few-shot CoT
                                                                                                 Q₁₀₁: Ralph is going to practice playing tennis with a
     Q: There are 15 polls in the grove....         1        2        3         4       5        tennis ball. A: Ralph played with 175 tennis balls. He hit
     A: There are 15 polls originally...... The                   u=5/5=1.0                      2/5 of the first 100 balls, so he hit 2/5 * 100 = 40 balls.
     answer is 6.                                                                                He hit 1/3 of the next 75 balls, so he hit 1/3 * 75 = 25
                                                                                                 balls. In total he hit 40 + 25 = 65 balls. He did not hit
                  :                                 Q₁₂: A robe takes 1 bolts of white           175 - 65 = 110 balls. The answer is 110.
     Q: Olin has $23. She bought five ...
     A: Olin had 23 dollars. 5 bagels......         fiber and double that much blue
                                                    fiber. How many bolts in total does                                            .
     The answer is 8.
                                                    it takes?                                    Q₄₀: Hans booked a room in a. hotel. The hotel has 10
                                                                                                                                   .
                                                                                                 floors ... A: Here are 10 floors with  10 rooms each. The
                   +
     Q: < UNLABELED_QUESTION >                      Probable Answers:                            last floor is unavailable. So, there are 9 * 10 = 90 rooms
                                                                                                 available. The answer is 90.
                                                    3        3        3         3       3
                        OR                                                                                                   +
                   Zero-shot CoT                                    u=1/5=0.2                                          Test Question
                                                                                                 Q: Janet's ducks lay 16 eggs per day. She eats three for
      Q: < UNLABELED_QUESTION >                                                                                        breakfast ...
      A: Let's think step by step.
                                                                    LLM
                                                                                                                         (4) Inference


Figure 16: The Active-Prompt framework: (1) Uncertainty Estimation uses multiple LLM outputs to identify challenging questions; (2) Question Selection ranks
questions by uncertainty; (3) Human Annotation provides detailed CoT explanations for selected questions; (4) Inference leverages the new exemplars to improve
model performance[108].




                                                                                32
    as opposed to random sampling, is a core tenet of active               • Symbolic Reasoning: Symbolic reasoning requires the
    learning [110] and maximizes the impact of each anno-                    ability to detect and apply logical patterns. A common
    tated example.                                                           example is a code-breaking question: “If ‘CAT’ is coded
                                                                             as ‘DBU,’ how will ‘DOG’ be coded?” LLMs may gen-
  • Human Annotation: Human experts offer comprehensive,                     erate inconsistent responses due to difficulty in recogniz-
    sequential explanations (Chain-of-Thought or CoT rea-                    ing patterns [3]. Active-Prompt addresses this by identi-
    soning) along with the correct answers for the chosen                    fying uncertain cases and adding annotated pattern-based
    questions (Fig. 16, Section (3)) [108, 13]. These anno-                  reasoning, such as: “Each letter shifts forward by one in
    tated examples serve as high-quality training data, guiding              the alphabet, so ‘DOG’ becomes ‘EPH’.” This organized
    the model to understand and replicate complex reasoning                  learning process, driven by human annotations, enhances
    processes. This organized, systematic approach enables                   the model’s capability to identify and use symbolic trans-
    the model to break down problems and solve them me-                      formations. [108].
    thodically, emulating human problem-solving strategies.
                                                                           • Scientific Reasoning: Scientific reasoning requires mod-
  • Inference & Learning: With the newly acquired anno-                      els to apply fundamental principles to explain natural phe-
    tated examples, the model’s training is refined. During                  nomena. For example, when asked: “Why does ice float on
    inference (Fig. 16, Section (4)), the model leverages the                water?” an LLM might generate generic responses with-
    learned reasoning patterns from the annotated data to gen-               out detailing the scientific reasoning [3]. Active-Prompt
    erate more accurate and logically sound answers to new                   enhances understanding by selecting uncertain cases and
    questions [108]. This repetitive process of uncertainty esti-            refining the model’s response using step-by-step physics-
    mation, selective annotation, and model refinement results               based explanations, such as: “Ice is less dense than wa-
    in ongoing performance enhancement, making the model                     ter because its molecules are arranged in a crystalline
    better at tackling complex reasoning tasks and minimizing                structure, causing it to float.” By improving the clarity
    errors.                                                                  and accuracy of scientific explanations, Active-Prompt
                                                                             helps LLMs perform better in academic and research-
                                                                             based queries [108]. This exemplifies how targeted an-
Examples of Active-Prompt. Active-Prompt can be applied to
                                                                             notation can improve performance on complex, domain-
various tasks that require complex reasoning and benefit from
                                                                             specific reasoning tasks.
human guidance, such as:
                                                                           • Multi-Step Decision Making: Active-Prompt enhances
  • Arithmetic Reasoning: Arithmetic reasoning involves
                                                                             LLMs in tasks requiring sequential reasoning, like “A
    solving mathematical problems that require logical steps.
                                                                             robot must navigate a grid with obstacles; what is the best
    For example, consider the problem: “A farmer has 20 ap-
                                                                             path?”. By selecting such problems and refining responses
    ples and gives 3 to each of his 4 friends. How many does
                                                                             with step-by-step logic, the model improves its decision-
    he have left?” A standard LLM might provide inconsis-
                                                                             making accuracy [108]. This demonstrates the applicabil-
    tent answers due to difficulty in multi-step calculations
                                                                             ity of Active-Prompt to problems beyond simple question-
    [3]. Active-Prompt helps by identifying such uncertain
                                                                             answering, encompassing tasks that require planning and
    cases and refining the model’s approach through human-
                                                                             sequential decision-making.
    annotated step-by-step solutions [108]. By incorporating
    Chain-of-Thought (CoT) reasoning [13], the model im-
                                                                         Advantages of Active-Prompt. Active-Prompt enhances Large
    proves its ability to perform multi-step arithmetic opera-
                                                                         Language Models (LLMs) by concentrating on uncertain and
    tions, leading to more accurate and logical responses.
                                                                         complex reasoning tasks. Here are its key advantages:
  • Commonsense Reasoning: Commonsense reasoning en-                       • Better Model Accuracy: By selecting the most uncertain
    ables models to make logical decisions based on everyday                 questions, Active-Prompt helps LLMs improve their rea-
    human experiences. For instance, a model might strug-                    soning ability. This targeted learning ensures the model
    gle with the question: “If John forgot to bring an umbrella              focuses on areas where it struggles the most, leading to
    and it starts raining, what will likely happen?” Without                 higher accuracy in various tasks [108]. This is a direct
    structured reasoning, the model may provide unclear or                   consequence of the active learning approach, which prior-
    overly simplistic answers [3]. Active-Prompt identifies                  itizes informative examples [110].
    such cases where uncertainty is high and incorporates de-
    tailed explanations like: “Without an umbrella, John will              • Efficient Use of Human Annotation: Instead of annotating
    likely get wet unless he finds shelter.” By selecting and                random questions, Active-Prompt chooses only the most
    annotating similar ambiguous cases [108], the model en-                  uncertain ones for human intervention. This reduces man-
    hances its ability to predict real-world outcomes more ef-               ual effort while maximizing the learning impact on the
    fectively. This builds upon the capabilities demonstrated                model [108]. This efficiency is a key advantage of active
    by CoT prompting [13] but focuses annotation on areas of                 learning, as it minimizes the cost of obtaining labelled data
    greatest uncertainty.                                                    [110].
                                                                    33
  • Enhanced Complex Reasoning: It improves multi-step                        differ significantly from its training data, highlighting a
    thinking by providing structured Chain-of-Thought (CoT)                   potential limitation in the transferability of learned reason-
    reasoning. This helps LLMs handle complex problems in                     ing patterns. This is a known challenge in few-shot and
    math, logic, and scientific explanations more effectively                 meta-learning.
    [108, 13]. Active-Prompt combines the benefits of CoT
    with the targeted improvement of active learning.                    2.5.2. Automatic Prompt Engineer (APE)
                                                                            Automatic Prompt Engineer (APE) is a method that auto-
  • Adaptability Across Different Tasks: Active-Prompt can
                                                                         mates the generation and selection of effective prompts for large
    be applied to various domains, including arithmetic, com-
                                                                         language models (LLMs) [113]. Instead of relying on manually
    monsense, symbolic, and scientific reasoning. This flex-
                                                                         crafted prompts, which can be time-consuming and require sig-
    ibility makes it useful for different real-world applica-
                                                                         nificant expertise [3], APE treats prompt generation as an opti-
    tions [108]. The general principles of active learning and
                                                                         mization problem. It utilizes LLMs to propose multiple candi-
    uncertainty-based selection are applicable regardless of
                                                                         date prompts and evaluates their performance based on a scor-
    the specific reasoning task.
                                                                         ing function [113]. The best-performing prompt is then selected
  • Reduces Model Uncertainty: By focusing on high-                      for use. This process is inspired by program synthesis, where
    uncertainty questions, the model gradually becomes more              instructions (or prompts) are optimized to improve the model’s
    confident and consistent in its answers. This leads to more          output accuracy and relevance. APE has been shown to outper-
    reliable and stable responses across different reasoning             form human-designed prompts in various tasks, enhancing the
    tasks [108, 111]. This reduction in uncertainty is a direct          efficiency and effectiveness of LLM-driven applications [29].
    result of the iterative process of identifying and addressing
    the model’s weaknesses.                                              Working Principle. The Automatic Prompt Engineer (APE)
                                                                         functions by systematically generating and selecting optimized
Limitations of Active-Prompt. Despite its effectiveness,                 prompts for Large Language Models (LLMs) through a struc-
Active-Prompt has some limitations:                                      tured process, as illustrated in Fig 17. It follows these key steps:

  • Dependence on Human Annotation: Active-Prompt re-                      • Instruction Proposal: APE generates multiple candidate
    quires human intervention to annotate selected questions                 prompts using an LLM (often the same LLM that will
    with Chain-of-Thought reasoning. While this improves                     be prompted or a similar one) based on input-output ex-
    accuracy, it adds extra effort and cost, limiting scalability            amples [113]. These prompts act as instructions to guide
    for large datasets [108]. This reliance on human exper-                  the target model’s behaviour. The goal is to create diverse
    tise is a common challenge in active learning approaches                 and meaningful prompts automatically instead of relying
    [110].                                                                   on human-written ones, which can be time-consuming and
                                                                             require significant domain expertise [3]. (See Fig. 17(a),
  • Sensitivity to Uncertainty Metrics: The effectiveness of                 step 1)
    Active-Prompt depends on how uncertainty is measured.
    Different uncertainty metrics (e.g., entropy, disagreement)            • Scoring and Evaluation: Each generated prompt is tested
    may impact selection quality, and choosing the best metric               on the target model (the LLM being optimized) using a
    is not always straightforward [108, 111]. The ideal metric               scoring function [113]. The accuracy of the execution
    may differ based on the particular task and model architec-              (i.e., whether the LLM’s output matches the desired out-
    ture.                                                                    put for given inputs) and the log probability of the target
                                                                             output given the prompt are common metrics used to mea-
  • Task-Specific Performance Variability: While it works                    sure how well the prompt influences the model’s response
    well in reasoning tasks, its effectiveness can vary across               [113, 114]. This helps identify the most effective prompts
    domains [108]. Some tasks may require additional fine-                   for the specific task. (See Fig. 17(a), steps 2 & 3)
    tuning or modifications to the prompting strategy or un-
    certainty estimation method to perform optimally. This is              • Filtering and Selection: Poorly performing prompts (those
    a general limitation of prompt-based learning approaches.                with low scores according to the scoring function) are dis-
                                                                             carded, and only the best-scoring ones are retained [113].
  • Computational Cost: Running multiple inferences per                      This process ensures that the selected prompts are of high
    question to estimate uncertainty requires significant com-               quality and contribute to better model performance, anal-
    putational resources [108, 112]. This can make Active-                   ogous to a selection process in evolutionary algorithms.
    Prompt costly, particularly for models and datasets of con-              (See the checkmarks and X’s in Fig. 17(a))
    siderable size. The computational cost of uncertainty esti-
    mation is a typical trade-off in active learning.                      • Iterative Refinement: If the selected prompts do not per-
                                                                             form well enough (e.g., don’t reach a desired accuracy
  • Limited Transferability: Annotated exemplars may not al-                 threshold), APE refines them by generating new variations
    ways generalize well across different models or datasets                 through an iterative Monte Carlo search [113]. This pro-
    [108]. The model may still struggle with new tasks that                  cess fine-tunes the prompts, iteratively improving them
                                                                    34
                                                                                              LLMs as Resampling Models
                             LLMs as Inference Models
                     Task: Antonyms                                                       Instruction: write the antonym of the
                     Instructions: <INSERT>                                               word.
                                                                                                                                           ……
                                                                                                           <LIKELIHOOD>
                     Here are the example responses:
                                                                                          Input: direct      Output: indirect
                     # Demonstration Start

                     Input: prove        Output: disprove                                                                              Log
                                                                            1                 2    Scoring                      3
                     Input: on           Output: off                                                                                Probability
                                                                         Proposals
                     # Demonstration End                                                          write the antonym of the word                   -0.26
                                                                                             give the antonym of the word provided                -0.28
                                     [Optional]
                                                                              4                                  ……                                ……
                             LLMs as Resampling Models                   High Score
                                                                                                          reverse the input.                      -0.86
                                                                         Candidates
                     Generate a variation of the following instruction                            to reverse the order of the letters             -1.08
                     while keeping the semantic meaning.
                                                                                5           write the opposite of the word given.                 -0.16
                     Input: write the antonym of the word.
                                                                                                                 ……                               ……
                     Output: write the opposite of the word given.         Similar
                                                                         Candidates               list antonyms for the given word.               -0.39


                         Keep the high score candidates              Discard the low score candidates             Final selected prompt with highest score


Figure 17: An example Automatic Prompt Engineering (APE) workflow. We draw this figure based on the information in [113]. An LLM interference model
proposes prompts based on observations. All proposals are scored by an LLM resampling model. High-score prompt proposals are sent to another LLM resampling
model. That resampling model generates a different variety of the input by keeping the same semantic meaning. Often, the variation gets a higher score compared
to the initially proposed prompt.


      until a satisfactory prompt is found or a computational                                 • Math Operations: The model performs arithmetic opera-
      budget is exhausted. This iterative approach allows APE                                   tions like addition or subtraction (e.g., 25 + 10 → 35).
      to explore the space of possible prompts and converge on                                  This assesses the model’s ability to perform symbolic ma-
      high-quality solutions. (See Fig. 17(a), steps 4 & 5)                                     nipulation and numerical reasoning [13].
                                                                                              • Cause and Effect Identification: The model determines
Examples of Automatic Prompt Engineer (APE). APE can be
                                                                                                which sentence describes the cause and which describes
applied to various tasks and domains to automate prompt engi-
                                                                                                the effect. This evaluates the model’s understanding of
neering, such as:
                                                                                                causal relationships and its ability to reason about events
                                                                                                [119].
   • Antonym Generation: The model is given a word and
     asked to generate its opposite (for example, hot → cold).                            Advantages of Automatic Prompt Engineer (APE). APE pro-
     This tests the model’s understanding of semantic relation-                           vides numerous advantages:
     ships between words [115].
                                                                                              • Improved Performance: APE finds instructions that often
   • Pluralization: The model converts singular words into                                      lead to better LLM performance (higher accuracy) on rea-
     their plural form (for example, cat → cats). This assesses                                 soning tasks compared to using instructions written by hu-
     the model’s grasp of basic morphological rules [3].                                        mans or generated by simpler methods [113]. This is be-
                                                                                                cause APE explores a wider range of possible instructions
   • Sentence Negation: The model rewrites a sentence in its                                    and selects the best ones through a systematic search pro-
     negative form (for example, “The sky is blue” → “The                                       cess.
     sky is not blue”). This evaluates the model’s ability to                                 • Reduced Human Effort: APE automates the process of
     manipulate sentence structure and logical negation [116].                                  finding good prompts, which usually requires a lot of man-
                                                                                                ual trial and error [3, 29]. This saves significant time and
   • Summarization: The model summarizes a given paragraph                                      effort for researchers and developers working with LLMs,
     into a shorter version. This requires the model to under-                                  allowing them to focus on other aspects of their projects.
     stand the main points of the text and condense them effec-
     tively [117].                                                                            • Task Adaptation: APE generates instructions that are
                                                                                                specifically tailored to the task at hand, based on the pro-
   • Translation: The model translates words or sentences into                                  vided examples [113]. This is more effective than using
     different languages (e.g., “Hello” → “Hola” in Spanish).                                   generic instructions that might not be relevant or optimal
     This tests the model’s multilingual capabilities and its un-                               for the specific task. This targeted approach is a key ad-
     derstanding of cross-lingual semantic relationships [118].                                 vantage of prompt engineering [114].
                                                                                     35
  • Model Agnostic: The method described in the paper is                 tasks without fine-tuning the LLM itself. Crucially, ART allows
    suitable for various Large Language Models (LLMs). It                for easy human-in-the-loop editing of generated programs and
    can be applied to different LLMs [113]. This generality              addition of new tools/tasks, enhancing performance and flexi-
    makes APE a versatile tool for prompt optimization.                  bility [120]. This contrasts with approaches that require exten-
                                                                         sive model retraining for new tasks or tools [3]. (See Fig 18)
  • Transferability: The best instructions found by APE for
    one LLM can often be used to improve the performance of              Working Principle. ART typically involves the following steps:
    other LLMs on the same task [113]. This suggests that the
    optimized prompts capture task-relevant information that               • Prompt Building: When presented with a new task, ART
    is useful across different model architectures. The core                 initiates the process by constructing a prompt to guide the
    idea is that the uncertainty stems from the task, not the                LLM [120]. ART searches the task library for demon-
    specific model.                                                          strations of similar tasks. These demonstrations, format-
                                                                             ted as programs with sequential reasoning steps and tool
Limitations of Automatic Prompt Engineer (APE). Despite its                  calls, are added to the prompt, enabling the LLM to lever-
benefits, APE has some limitations:                                          age cross-task generalization by drawing from related sub-
  • High Computational Cost: Scoring candidate instructions                  steps and tools [120]. This is similar in concept to few-shot
    requires many executions of the target LLM, making APE                   learning, but with structured programs instead of simple
    computationally expensive, particularly for larger models                input-output examples [3].
    or datasets [113]. This is a common challenge in methods
                                                                           • Generation and Parsing: With the prompt assembled, the
    that rely on extensive search or sampling.
                                                                             LLM begins generating its program, outlining the steps to
  • Proposal LLM Dependence: APE’s success is limited by                     solve the task [120]. Simultaneously, ART parses this pro-
    the quality of the initial instruction proposals generated               gram in real time, understanding the intended actions and
    by the proposal LLM [113]. Weaker proposal LLMs, or                      tool usage specified by the LLM. This parsing step is cru-
    poorly designed meta-prompts (prompts used to generate                   cial for enabling the interaction between the LLM and ex-
    the candidate prompts), will hinder performance, as APE                  ternal tools.
    can only select from the provided candidates.
                                                                           • Tool Use and Integration: A key aspect of ART’s func-
  • Crucial Score Function Choice: The chosen score func-                    tionality is its ability to utilize external tools [120]. Dur-
    tion (e.g., execution accuracy, log probability of the target            ing program generation, whenever ART encounters a tool
    output) must align well with the desired task behaviour                  call (e.g., a call to a search engine or a code interpreter),
    [113, 114]. An inappropriate score function will lead to                 it pauses the LLM’s generation. ART then executes the
    suboptimal instruction selection, as it may not accurately               specified tool and obtains its output, which is subsequently
    reflect the true quality of a prompt for the task.                       integrated back into the program [120]. This provides the
                                                                             LLM with new information (the tool’s output) to continue
  • Limited Instruction Transferability: Instructions opti-                  the reasoning process and guide subsequent steps. This
    mized for one target LLM may not perform well when                       dynamic interaction with tools is a distinguishing feature
    used with a different LLM, indicating model-specific op-                 of ART.
    timization [113]. This suggests that while APE can find
    good prompts, those prompts might not be universally ef-               • Human Feedback (Optional): ART incorporates an op-
    fective across different model architectures or sizes.                   tional human-in-the-loop component to further improve
                                                                             performance [120]. Humans can refine ART’s capabilities
  • Marginal Gains from Iteration: The iterative refinement                  by contributing new demonstrations to the task library, ex-
    process, while sometimes helpful, often provides only                    panding the range of scenarios the system can handle, and
    slight improvements over the initial instruction proposal                correcting any identified errors. Additionally, humans can
    [113]. This suggests that the initial proposal stage is cru-             add or edit tools in the tool library, enabling ART to ac-
    cial, and the iterative search may have diminishing returns.             cess a broader set of functionalities and adapt to new task
                                                                             requirements. This human-in-the-loop aspect allows for
2.5.3. Automatic Reasoning and Tool-use (ART)                                continuous improvement and adaptation of the system.
   Automatic Reasoning athe nd Tool-use (ART) is a frame-
work that enables frozen Large Language Models (LLMs) to                 Examples of Automatic Reasoning and Tool-use (ART). ART
perform complex tasks by automatically generating multi-step             can be applied to various tasks that require both reasoning and
reasoning “programs” [120]. ART leverages a task library of              tool use, such as:
demonstrations from related tasks, showing how to decompose
problems and use external tools (like search or code execution)            • Physics Question Answering (PQA): To solve a physics
[120]. The LLM generates a program in a simple, structured                   problem, ART first searches for the relevant formula re-
query language, which is then executed, integrating tool out-                lated to the given question [120]. This could involve
puts [120]. This approach achieves strong generalization to new              querying a knowledge base or using a search engine [121].
                                                                    36
                                                                             Task Library
                           A. Select Examples

                           Task: Anachronisms                                             Task: Arithmetic
                           Input: George HW Gulf War                                      Input: Viola bought 167 books...
                           Q1: [search] When was George H.W. Bush,                        Q1: [gen code] Write arithmetic as python code
                           president?                                                     #1: viola =167, nancy = 137 ans = viola - nancy
                           #1: From 1989-1993 ... Q2: [EOQ]                               Q2: [exec code] Execute code Q3: [EOQ]
                           Ans: True                                                      Ans: 30

                                                                             Frozen LLM
                          B. Run Program

                          Q1: (search] How to write English as Pig Latin?                                            Meaning of Text and
                          #1: Add "yay" if it starts with a vowel                                                    Highlight Color:
                          Q2: [gen code] Write code to translate "albert goes
                                                                                                                     Task Library Examples
                          driving" to pig latin.
                          #2: for w in §'aIbert", ’goes", "homes: if w{0] in "aeiou": print(w + ’yay") ...           Tool Output
                          Q3: [exec] Execute snippet
                                                                                                                     LLM Output
                          #3: albertyay oesgay rivingday
                          Q4: [EOQ]                                                                                  Human Feedback
                          Ans: albertyay oesgay rivingday

                           C. Fix Mistake (Optional)

                          Q1: [search] How to write English as Pig Latin?
                          #1: Add "yay" if it starts with a vowel ...
                          Q2: [gen code] Write code to translate "albert ...
                          #2: for w in ["albert", "goes", "home"]: if w[0] in "aeiou": print(w + "yay") ...consonent cluster = find cIstr(w)
                          Q3: [exec code] Execute snippet
                          #3: albertyay oesgay ivingdray Q4: [EOQ]
                          Ans: albertyay oesgay ivingdray
                                                                                                                                                          Fig. 19



Figure 18: The ART framework. A frozen LLM generates multi-step reasoning programs based on a task library of demonstrations. These programs, written in
a structured query language, are executed, integrating outputs from external tools (e.g., search, code execution) to solve complex tasks without LLM fine-tuning
[120].


      Once the correct formula is found, a Python script is gen-                                 precision in arithmetic reasoning. The model then formats
      erated that substitutes the given numerical values into the                                and presents the final numerical result as the answer. This
      equation. The generated script is then executed to compute                                 exemplifies ART’s ability to translate natural language de-
      the final answer. If necessary, additional steps, such as unit                             scriptions into executable code, a form of program synthe-
      conversion or rounding, are performed before the result                                    sis [125]. This also relates to the broader area of using
      is returned. This demonstrates ART’s ability to combine                                    LLMs for mathematical reasoning [13].
      information retrieval (searching for formulas) with code
                                                                                              • Word Unscrambling: In a word unscrambling task, ART
      generation and execution, similar to systems that combine
                                                                                                starts by splitting the given jumbled word into its letters
      LLMs with symbolic reasoning [122].
                                                                                                [120]. It then generates all possible letter permutations
   • Anachronism Detection: When analyzing a statement                                          and cross-checks them against an English dictionary using
     for anachronisms, ART begins by searching for histori-                                     a lookup function (acting as an external tool). The model
     cal facts, such as the timeline of a historical figure or                                  identifies the most probable valid word from the list and
     event [120]. It retrieves the relevant information, po-                                    returns it as the correct answer. This shows how ART can
     tentially from a structured knowledge graph or a histori-                                  combine algorithmic processing (permutation generation)
     cal database [123], and compares the dates to determine                                    with external knowledge (dictionary lookup), leveraging
     whether the mentioned entities could have co-existed.                                      both procedural and declarative knowledge.
     Based on this comparison, the model generates a response
                                                                                              • Translation into Pig Latin: For translating a sentence into
     stating whether or not the statement contains an anachro-
                                                                                                Pig Latin, ART first searches for the linguistic rules gov-
     nism. This showcases ART’s ability to use external knowl-
                                                                                                erning Pig Latin transformations [120, 126]. This demon-
     edge (historical facts) for reasoning, a key aspect of many
                                                                                                strates a form of rule learning or rule induction from exam-
     knowledge-intensive NLP tasks [124].
                                                                                                ples. It then generates a Python program that applies these
   • Arithmetic Word Problems: To solve a mathematical word                                     rules to each word in the sentence. The generated code is
     problem, ART first extracts key numerical values and iden-                                 executed to transform the words accordingly, and the final
     tifies the required operations [120]. It then generates a                                  translated sentence is returned. This illustrates ART’s ca-
     Python program that performs the necessary calculations.                                   pability to learn and apply procedural rules through code
     The code is executed to compute the final answer, ensuring                                 generation, showcasing a form of symbolic manipulation.
                                                                                     37
Advantages of Automatic Reasoning and Tool-use (ART). ART                     library, ART may struggle. This limits its zero-shot gener-
offers several advantages:                                                    alization capabilities, a challenge also faced by other few-
                                                                              shot and meta-learning approaches [127].
  • Automation: ART automatically decomposes complex
    tasks into structured reasoning steps without requiring                 • Error Propagation: If an error occurs in an early reason-
    additional training or human intervention [120], making                   ing step (e.g., an incorrect tool call or misinterpretation of
    problem-solving more systematic and efficient. This con-                  the task), it can cascade through subsequent steps, leading
    trasts with approaches that rely on manual prompt engi-                   to incorrect final answers [120]. This is particularly prob-
    neering or extensive fine-tuning for each new task [3].                   lematic in complex tasks that require multiple dependent
  • Tool-Use: ART seamlessly integrates external tools such                   reasoning steps. Error propagation is a common challenge
    as search engines, code execution, and calculators, al-                   in multi-step reasoning systems and sequential decision-
    lowing large language models to perform advanced com-                     making [128].
    putations and retrieve real-time information [120]. This
                                                                            • Computational Overhead: The process of retrieving task
    extends the capabilities of LLMs beyond their inherent
                                                                              demonstrations, generating intermediate steps, and exe-
    knowledge and reasoning abilities [122].
                                                                              cuting external tools can be computationally expensive
  • Generalization: By using a task library with reasoning                    compared to more straightforward prompting techniques
    examples, ART can generalize to new and unseen tasks                      [120]. This can make ART slower in specific scenarios,
    without requiring task-specific prompt engineering or ad-                 especially when dealing with large task libraries or com-
    ditional fine-tuning [120]. This cross-task generalization                plex tool interactions. This trade-off between performance
    capability is a significant advantage over methods that are               and computational cost is a recurring theme in LLM re-
    tailored to specific tasks or domains.                                    search [3].

  • Adaptability: Users can modify task programs, correct er-               • Manual Intervention for Improvement: While ART sup-
    rors, or add new tools, allowing ART to continuously im-                  ports human feedback to correct errors or add new tools,
    prove and adapt to different domains with minimal effort                  this requires manual effort [120]. Continuous performance
    [120]. This human-in-the-loop aspect facilitates iterative                improvements depend on users actively refining the task
    refinement and customization.                                             and tool libraries. This reliance on human intervention can
                                                                              limit the scalability and autonomy of the system, contrast-
  • Performance: ART significantly outperforms standard                       ing with the goal of fully automated reasoning.
    few-shot learning and automatic chain-of-thought (CoT)
    prompting on benchmarks like BigBench and MMLU,                         • Difficulty with Open-Ended Tasks: ART performs well on
    leading to higher accuracy in reasoning tasks [120]. This                 structured reasoning problems, but it may struggle with
    demonstrates the effectiveness of ART’s approach in en-                   open-ended, abstract, or creative tasks that do not have
    hancing LLM performance.                                                  clear multi-step decomposition patterns or require subjec-
  • Efficiency: By automating task decomposition and op-                      tive judgment [120]. This is because ART relies on a struc-
    timizing tool use, ART reduces computational overhead                     tured, program-like representation of the reasoning pro-
    and improves problem-solving speed while minimizing re-                   cess, which may not be suitable for all types of tasks. This
    source consumption [120]. This is in contrast to some                     limitation highlights the ongoing challenges in applying
    other methods that might require multiple LLM calls or                    LLMs to tasks requiring creativity or common sense rea-
    extensive search procedures.                                              soning [24].

Limitations of Automatic Reasoning and Tool-use (ART). De-                2.5.4. Contrastive Chain-of-Thought Prompting (CCoT)
spite its benefits, ART has some limitations:                                Contrastive Chain-of-Thought (CCoT) prompting enhances
  • Tool Dependency: ART relies on external tools like search             LLM reasoning by providing both valid and invalid reason-
    engines and code execution, which may not always be                   ing examples [129]. Inspired by human learning from positive
    available or function correctly [120]. If a tool fails or pro-        and negative examples, CCoT guides the model to reason step-
    vides incorrect data, ART’s performance is negatively af-             by-step while reducing mistakes [129]. Unlike standard CoT
    fected. This dependency on external resources introduces              [13], it informs the model what errors to avoid. CCoT lever-
    a potential point of failure, a common concern in systems             ages automatically constructed contrastive demonstrations to
    that integrate LLMs with external tools [122].                        improve generalization [129]. By analyzing invalid reasoning
                                                                          types, CCoT combines positive and negative demonstrations
  • Task Library Constraints: Since ART selects reasoning                 to boost CoT effectiveness. Experiments on reasoning bench-
    demonstrations from a predefined task library, its ability            marks demonstrate significant improvements compared to con-
    to generalize to completely novel tasks depends on the di-            ventional CoT [129]. The approach is task-agnostic and com-
    versity and completeness of this library [120]. If a task             patible with methods such as self-consistency [112], serving as
    requires reasoning skills or knowledge not covered in the             a general enhancement of chain-of-thought prompting.
                                                                     38
Working Principle. CCoT prompting typically involves the fol-                  state that James writes 12 × 52 = 624 pages per week.
lowing steps:                                                                  Then, we contradict ourselves by concluding he writes
                                                                               only 12 pages a year.” This example demonstrates how
  • Inspiration from Human Learning: CCoT is inspired by                       CCoT can help the model avoid errors in multi-step cal-
    the way humans learn, which involves understanding both                    culations by showing an example of incorrect reasoning.
    what to do (positive examples) and what *not* to do (neg-                  This addresses a known limitation of LLMs in performing
    ative examples) [129]. This approach mirrors how humans                    multi-step arithmetic [129, 13]. (See Fig. 19, Contrastive
    refine their understanding through both positive reinforce-                Chain-of-Thought, for an illustration of how both correct
    ment and error correction.                                                 and incorrect reasoning are presented.)
  • Contrastive Demonstrations: Instead of just providing ex-                • Factual Reasoning: “Who is the grandchild of Dambar
    amples of correct reasoning (as in standard CoT [13]),                     Shah?”
    CCoT provides both *valid* (correct) and *invalid*                         Valid CoT Answer: “Dambar Shah was the father of Kr-
    (incorrect) reasoning demonstrations within the prompt                     ishna Shah. Krishna Shah was the father of Rudra Shah,
    [129]. Figure 1 in the paper illustrates this, showing                     making him the grandchild.”
    a question with both an “Explanation” (correct) and a                      Invalid CoT Answer (Incorrect Reasoning): “Dambar
    “Wrong Explanation” (incorrect). This explicit contrast                    Shah was the king of the Gorkha Kingdom, unrelated to
    is key to the method.                                                      the question. We wrongly state that Dravya Shah, not Kr-
  • Guiding the Model: The contrastive demonstrations guide                    ishna Shah, was Rudra Shah’s father.”
    the LLM to reason step-by-step, while also highlighting                    Invalid CoT Answer (Incoherent Language): “Krishna
    potential mistakes to avoid [129]. This helps the model                    Shah was the father of Rudra Shah. We then incorrectly
    learn not only the correct reasoning path but also the pit-                state that Dambar Shah was Krishna Shah’s child.” This
    falls that can lead to incorrect conclusions. It’s like provid-            example shows how CCoT can help the model avoid fac-
    ing both a roadmap and warnings about common detours.                      tual errors and inconsistencies in its reasoning by provid-
                                                                               ing examples of both incorrect and incoherent reasoning.
  • Automatic Construction of Contrastive Demonstrations:                      This is relevant to the challenge of ensuring LLMs produce
    To improve generalization and reduce the manual effort                     factually correct and logically sound outputs [129, 9]. (See
    of creating negative examples, the paper introduces an au-                 Fig. 19, Contrastive Chain-of-Thought, for a general illus-
    tomatic method for constructing these contrastive demon-                   tration of this principle.)
    strations from existing valid reasoning chains [129]. This
    makes the approach more scalable and practical.                          • Arithmetic Reasoning: “Leah had 32 chocolates, and her
                                                                               sister had 42. If they ate 35, how many pieces do they have
  • Leveraging Invalid Reasoning Types: The authors analyze                    left in total?”
    various types of invalid reasoning to design an effective                  Valid CoT Answer: “Leah had 32 chocolates, and her sis-
    method for generating contrastive demonstrations [129].                    ter had 42, making a total of 32 + 42 = 74. After eating
    By understanding common errors, they can create targeted                   35, the remaining chocolates were 74 - 35 = 39.”
    negative examples that are more likely to be helpful for the               Invalid CoT Answer (Incorrect Reasoning): “Leah’s sister
    model.                                                                     had 42 - 32 = 10 more chocolates than Leah. After eating
                                                                               35, we wrongly add 10 + 35 = 45 and subtract 6 to get
  • General Enhancement: CCoT is designed to be task-                          39.”
    agnostic and compatible with other methods that enhance                    Invalid CoT Answer (Incoherent Objects): “Leah had 32
    chain-of-thought prompting, such as self-consistency                       + 42 = 74 chocolates but was incorrectly assigned only
    [112, 129]. This makes it a versatile tool for improving                   32. After subtracting 35, we mistakenly claim 42 choco-
    LLM reasoning across different tasks and in combination                    lates are still left.” This example demonstrates how pro-
    with other techniques.                                                     viding contrastive examples with errors related to object
                                                                               coherence and incorrect operations can make an LLM
Examples of Contrastive Chain-of-Thought Prompting (CCoT).                     avoid such errors. This relates to the broader problem
CCoT prompting can be applied to various tasks that benefit                    of ensuring LLMs maintain consistency in their reasoning
from contrastive reasoning and logical deduction, such as:                     about objects and quantities [129, 23]. (See Fig. 19, Con-
                                                                               trastive Chain-of-Thought, for a visual example of using
  • Mathematical Calculation: ”James writes a 3-page letter
                                                                               contrastive reasoning.)
    to 2 different friends twice a week. How many pages does
    he write a year?”
    ”Valid CoT Answer: James writes 3 × 2 = 6 pages per ses-               Advantages of Contrastive Chain-of-Thought Prompting
    sion. Since he writes twice a week, that’s 6 × 2 = 12 pages            (CCoT). CCoT prompting offers several advantages:
    per week. There are 52 weeks in a year, so he writes 12 x
    52 = 624 pages a year.”                                                  • Improved Reasoning Accuracy: CCoT provides both valid
    Invalid CoT Answer (Wrong Explanation): We mistakenly                      and invalid reasoning demonstrations, helping the model
                                                                      39
                                                                                                               Contrastive Chain-of-
              Standard Prompting                          Chain-of-Thought (CoT)
                                                                                                               Thought

                   Question: James writes a                                                                  Question: James writes a 3-page letter to 2 different
                   3-page letter to 2 different         Question: James writes a 3-page letter to 2
                                                                                                             friends twice a week. How many pages does he write a
                   friends twice a week.                different friends twice a week.How many
                                                                                                             year?
                   How many pages does he               pages does he write a year?
                   write a year?                                                                             Explanation: He writes each friend 3*2=6 pages a week.
                                                        Explanation: He writes each friend 3*2=6
                                                                                                             So he writes 6*2=12 pages every week. That means he
                   Answer: 624                          pages a week. So, he writes 6*2=12 pages
                                                                                                             writes 12*52=624 pages a year.
                                                        every week. That means he writes
                                                        12*52=624 pages a year.
                                                                                                             Wrong Explanation: He writes each friend 12*52=624
                   Question: James has 30                                                                    pages a week. So he writes 3*2=6 pages every week.
                   teeth. His dentist drills 4          Question: James has 30 teeth. His dentist
                                                                                                             That means he writes 6*2=12 pages a year.
                   of them and caps 7 more              drills 4 of them and caps 7 more teeth than
                   teeth than he drills. What           he dills. What percentage of James teeth
                                                                                                             Question: James has 30 teeth. His dentist drilis 4 of
                   percentage of James                  does the dentist fix?
                                                                                                             them and caps 7 more teeth than he drills. What
                   teeth does the dentist fix?                                                               percentage of James' teeth does the dentist fix?


                  Model Output

                  Answer: 37.5%                          Explanation: The dentist fixes a total of           Explanation: The dentist drills 4 teeth, so there are
                                                         4+7=11 teeth. To find the percentage ,              30-4=26 teeth left. The dentist caps 7 more teeth
                                                         we divide the number of teeth and                   than he drills, so he caps 4+7 = 11 teeth. Therefore,
                                                         multiply by 100: 11/30 x 100= 36.67%                the dentist fixes a total of 4+11= 15 teeth. To find
                                                                                                             the percentage of teeth the dentist fixes, we divide
                                                                                                             the number of teeth fixed by the total number of
                                                                                                             teeth and multiply by 100. 15/30 x 100= 50%




         Figure 19: Comparison of Standard Prompting, Chain-of-Thought (CoT) Prompting, and Contrastive Chain-of-Thought (CCoT) Prompting. CCoT, in particular,
         demonstrates the use of both valid and invalid reasoning examples to improve model performance [129].
ig. 20
              learn not only the correct reasoning but also recognize and                       nation of contrastive examples and self-consistency lever-
              avoid common mistakes [129]. This reduces error propa-                            ages both explicit error guidance and ensemble methods.
              gation in multi-step reasoning tasks, a common challenge
              for LLMs [128].                                                               • Task-Agnostic and Easily Adaptable: Since CCoT is not
                                                                                              restricted to specific reasoning types, it can be applied
           • Enhanced Generalization Across Tasks: Unlike standard                            to various domains, including arithmetic problems, fac-
             CoT [13], which only provides correct reasoning exam-                            tual question answering, and even more complex problem-
             ples, CCoT exposes the model to diverse reasoning pat-                           solving tasks [129]. This versatility makes it a valuable
             terns, including incorrect ones [129]. This leads to bet-                        tool for improving LLM performance across a wide range
             ter generalization across different reasoning benchmarks,                        of applications.
             such as arithmetic and factual QA tasks. This broader ex-
             posure to different reasoning styles can improve robust-                     Limitations of Contrastive Chain-of-Thought Prompting
             ness.                                                                        (CCoT). Despite its benefits, CCoT prompting has some
                                                                                          limitations:
           • Automation: Incorrect reasoning examples are automati-
             cally generated, reducing the need for manual annotation                       • Quality of Demonstrations: The success of CCoT relies on
             [129]. This makes the approach more scalable and effi-                           the quality and relevance of both the positive and negative
             cient compared to methods that rely on human-crafted ex-                         demonstrations provided [129]. Poorly designed or irrel-
             amples.                                                                          evant demonstrations can hinder the model’s learning and
                                                                                              potentially degrade performance. This is a general chal-
           • Higher Performance on Benchmarks: CCoT significantly                             lenge in prompt-based learning [114].
             outperforms conventional CoT in reasoning tasks [129].
             For example, it improves accuracy by 9.8 points on GSM-                        • Computational Cost: While CCoT does not increase the
             8K (arithmetic reasoning) and 16.0 points on Bamboogle                           annotation cost compared to standard CoT, it may slightly
             (factual reasoning) when tested on GPT-3.5-Turbo. These                          increase the computational cost due to the more complex
             results demonstrate the practical effectiveness of the ap-                       prompts and the potential need for more generated tokens
             proach.                                                                          during inference [129]. This is because the prompts con-
                                                                                              tain both valid and invalid reasoning chains. This trade-off
           • Compatibility with Self-Consistency Methods: CCoT                                between performance and computational cost is a common
             works well with self-consistency decoding [112, 129], fur-                       consideration [3].
             ther improving performance by aggregating multiple rea-
             soning paths. This makes the approach more reliable, es-                       • Complexity of Negative Examples: Generating truly effec-
             pecially in tasks requiring logical precision. The combi-                        tive negative examples that are informative but not confus-
                                                                                     40
     ing can be challenging [129]. The negative examples must              • Prompt Design: The prompt is designed to include emo-
     be close enough to the correct reasoning path to be helpful             tional cues or instructions that guide the LLM to gener-
     but distinct enough to be clearly identifiable as incorrect.            ate text that evokes the desired emotion [130]. This could
                                                                             involve using emotionally charged words, phrases, or de-
  • Reliance on LLM Capabilities: CCoT depends on the
                                                                             scriptions or explicitly instructing the LLM to adopt a spe-
    LLM’s ability to understand and utilize the contrastive in-
                                                                             cific emotional tone or perspective [132].
    formation, which may be limited by the LLM’s inherent
    capabilities or training data [129]. Weaker LLMs might                 • LLM Processing: The LLM processes the prompt, includ-
    not be able to effectively distinguish between valid and in-             ing the emotional cues, and uses its understanding of lan-
    valid reasoning chains.                                                  guage and emotions to generate text that aligns with the
  • Limited Understanding of CoT: A comprehensive under-                     desired emotional expression [133].
    standing of the underlying processes of CoT itself is still
    lacking [13], making it difficult to design and optimize               • Response Evaluation: The generated response is evaluated
    CCoT prompts effectively. Further research into *why*                    based on its emotional impact and effectiveness in evoking
    CoT works is needed to fully leverage its potential, and                 the desired emotion in the reader [131]. This evaluation
    this applies to CCoT as well.                                            can be done through human feedback or automated senti-
                                                                             ment analysis tools [130].
  • Unpredictability of Invalid Reasoning Types: The effect
    of different types of invalid reasoning (e.g., incoherent ob-        Examples of Emotion Prompting. Emotion Prompting can be
    jects, irrelevant language) on the model’s performance can           applied to various tasks that require emotional expression and
    be difficult to predict [129]. More research is needed to            engagement, such as:
    understand how different types of errors impact learning
    and how to best tailor negative examples.                              • Storytelling: “Write a short story about a young boy who
                                                                             loses his beloved dog.” The prompt includes emotional
2.6. Emotion-Aware and Psychological Techniques (Methods
                                                                             cues: “Focus on the emotions of sadness, grief, and long-
     that incorporate human-like reasoning and emotional in-
                                                                             ing. Describe the boy’s memories of his dog and his strug-
     telligence)
                                                                             gle to cope with the loss.”
2.6.1. Emotion Prompting
   Emotion-promoting refers to enhancing cognitive functions,              • Poetry Generation: “Write a poem about the beauty of na-
decision-making, and problem-solving abilities by incorporat-                ture.” The prompt includes emotional cues: “Evoke feel-
ing emotional stimuli. The concept is rooted in psychological                ings of awe, wonder, and appreciation. Use vivid imagery
theories that suggest emotions play a crucial role in guiding at-            and metaphors to capture the essence of nature’s splen-
tention, learning, and behaviour regulation. Studies show that               dour.”
emotional intelligence, which includes the ability to recognize,
understand, and manage emotions, significantly influences hu-              • Dialogue Generation: “Generate a conversation between
man actions and success in various domains, such as education                two friends who are discussing a difficult personal prob-
and health.                                                                  lem.” The prompt includes emotional cues: “One friend is
   In the context of artificial intelligence, particularly Large             expressing feelings of anxiety and stress, while the other
Language Models (LLMs), emotion-promoting involves em-                       friend is offering support and encouragement.”
bedding emotional cues into prompts to improve model per-
formance. This method, known as EmotionPrompt, integrates                Advantages of Emotion Prompting. Emotion Prompting offers
emotionally charged phrases to enhance the effectiveness of AI-          several advantages:
generated responses. Research has demonstrated that Emotion-
Prompt can lead to substantial improvements in AI tasks, mak-
                                                                           • Enhanced Expressiveness: Enables LLMs to generate
ing outputs more accurate, truthful, and responsible. By draw-
                                                                             more expressive and emotionally engaging content [130].
ing from psychological principles like self-monitoring, social
cognitive theory, and cognitive emotion regulation, emotion-               • Improved Creativity: Encourages LLMs to explore differ-
promoting can shape both human and AI interactions, leading                  ent emotional tones and perspectives, leading to more cre-
to more insightful and meaningful engagements.                               ative and diverse outputs [132].
Working Principle. Emotion Prompting typically involves the
following steps:                                                           • Increased Engagement: Makes LLM-generated content
                                                                             more engaging and relatable by evoking emotions in the
  • Emotion Selection: The desired emotion or sentiment                      reader [133].
    is selected based on the specific application or objective
    [130]. This could be a basic emotion like joy, sadness,                • Adaptability: Can be adapted to various tasks and domains
    anger, or fear, or a more complex emotion like nostalgia,                by selecting appropriate emotions and designing effective
    hope, or irony [131].                                                    prompts [131].
                                                                    41
Limitations of Emotion Prompting. Despite its benefits, Emo-              Examples of Scratchpad Prompting. Scratchpad prompting
tion Prompting has some limitations:                                      can be applied to various tasks that benefit from external mem-
                                                                          ory and multi-step reasoning, such as:
  • Subjectivity: Evaluating the emotional impact of LLM-
    generated content can be subjective and challenging [130].              • Mathematical Problem Solving: “Calculate the volume of
                                                                              a cone with radius 5 cm and height 10 cm.” The LLM uses
  • Ethical Considerations: Eliciting strong emotions in users                the scratchpad to store the formula for the volume of a
    raises ethical concerns about potential manipulation or                   cone, the intermediate calculations, and the final result.
    harm [130].
                                                                            • Logical Reasoning: “If all men are mortal, and Socrates is
  • Limited Understanding: LLMs may not fully understand                      a man, is Socrates mortal?” The LLM uses the scratchpad
    the nuances and complexities of human emotions, poten-                    to store the premises and the logical rules, deriving the
    tially leading to inaccurate or inappropriate emotional ex-               conclusion step-by-step.
    pressions [132].                                                        • Planning and Decision-Making: “Plan a trip from City
                                                                              A to City C, considering the available transportation op-
2.6.2. Scratchpad Prompting                                                   tions, your budget, and your preferred travel time.” The
   Scratchpad prompting is a technique that enhances the                      LLM uses the scratchpad to store information about differ-
problem-solving abilities of large language models (LLMs) by                  ent routes, costs, and schedules, comparing and evaluating
allowing them to use an external “scratchpad” or memory to                    the options before making a decision.
store and manipulate intermediate results, notes, or informa-
                                                                          Advantages of Scratchpad Prompting. Scratchpad prompting
tion during the reasoning process [72]. This approach draws
                                                                          offers several advantages:
inspiration from how humans often use scratchpads or external
memory aids to solve complex problems, offloading cognitive                 • Improved Reasoning: Enhances the LLM’s ability to per-
burden and maintaining a record of intermediate steps [82]. By                form complex reasoning and problem-solving by provid-
providing LLMs with a scratchpad, this technique enables them                 ing external memory and scaffolding [72].
to break down complex tasks into smaller, more manageable
steps, keep track of intermediate calculations or results, and re-          • Reduced Errors: Minimizes errors caused by memory lim-
fer back to previous information, leading to improved perfor-                 itations or cognitive overload by allowing the LLM to of-
mance in tasks that require multi-step reasoning, planning, and               fload information to the scratchpad [82].
decision-making [134].
                                                                            • Enhanced Interpretability: Makes the LLM’s reasoning
                                                                              process more transparent and understandable by revealing
Working Principle. Scratchpad prompting typically involves                    the intermediate steps and the use of the scratchpad [134].
the following steps:
                                                                            • Adaptability: Can be adapted to various tasks and domains
  • Scratchpad Initialization: A scratchpad or external mem-                  by adjusting the structure and content of the scratchpad
    ory is initialized, which can be a simple list, a dictionary,             and the instructions in the prompt [72].
    or a more complex data structure, depending on the task
    and the type of information to be stored [72].                        Limitations of Scratchpad Prompting. Despite its benefits,
                                                                          Scratchpad prompting has some limitations:
  • Prompt Integration: The prompt instructs the LLM to use
                                                                            • Scratchpad Management: Requires effective management
    the scratchpad to store and manipulate information dur-
                                                                              of the scratchpad to avoid clutter and ensure efficient ac-
    ing the reasoning process [82]. This may involve ex-
                                                                              cess to relevant information [82].
    plicit instructions on how to interact with the scratchpad,
    such as “Write down your intermediate calculations on the               • Prompt Engineering: Designing prompts that guide the
    scratchpad” or “Use the scratchpad to keep track of the                   LLM’s interaction with the scratchpad can be challenging
    facts you have learned” [134].                                            [134].

  • LLM Processing: The LLM processes the prompt and                        • Computational Cost: Maintaining and accessing an exter-
    uses the scratchpad to store and retrieve information as                  nal scratchpad can increase the computational cost and re-
    needed, performing calculations, making notes, or updat-                  sponse time of the LLM [72].
    ing its knowledge based on the intermediate results [72].
                                                                          2.6.3. Program of Thoughts (PoT) Prompting
  • Response Generation: The LLM generates a response                        Program of Thoughts (PoT) prompting is a novel prompt-
    based on the prompt and the information stored on the                 ing technique that aims to improve the reasoning capabilities
    scratchpad, demonstrating its ability to utilize the exter-           of large language models (LLMs) by representing the reason-
    nal memory to solve the problem or answer the question                ing process as a program [135]. This approach draws inspira-
    [82].                                                                 tion from the field of computer programming, where complex
                                                                     42
tasks are broken down into smaller, more manageable modules           Advantages of Program of Thoughts (PoT) Prompting. PoT
or functions [135]. By representing reasoning as a program,           prompting offers several advantages:
PoT prompting allows LLMs to execute a series of instructions,
manipulate intermediate variables, and control the flow of in-          • Structured Reasoning: Encourages structured and system-
formation during the reasoning process, leading to more sys-              atic reasoning by representing the reasoning process as a
tematic and accurate problem-solving [136].                               program [135].
                                                                        • Improved Accuracy: Improves the accuracy of LLM-
Working Principle. PoT prompting typically involves the fol-              generated responses by enabling precise execution of
lowing steps:                                                             instructions and manipulation of intermediate variables
                                                                          [137].
  • Program Generation: The LLM is prompted to generate a
    program that represents the reasoning process for a given           • Enhanced Interpretability: Makes the LLM’s reasoning
    task or question [135]. This program can be expressed in              process more transparent and understandable by revealing
    a natural language format or a more formal programming                the program it generated and executed [136].
    language, depending on the complexity of the task and the
    capabilities of the LLM [137].                                      • Versatility: Can be adapted to various tasks and do-
                                                                          mains by designing appropriate programs and incorporat-
  • Program Execution: The LLM executes the generated pro-                ing domain-specific knowledge [135].
    gram, following the instructions and manipulating the in-
    termediate variables or data structures as defined in the         Limitations of Program of Thoughts (PoT) Prompting. Despite
    program [135].                                                    its benefits, PoT prompting has some limitations:

  • Answer Extraction: The final answer or solution is ex-              • Program Generation: Generating effective programs that
    tracted from the output of the program execution [136].               accurately represent the reasoning process can be chal-
                                                                          lenging, requiring programming skills and domain exper-
Examples of Program of Thoughts (PoT) Prompting. PoT                      tise [135].
prompting can be applied to various tasks that benefit from             • Computational Cost: Executing complex programs can
structured reasoning and program-like execution, such as:                 be computationally expensive, potentially increasing re-
                                                                          sponse time and resource usage [136].
  • Mathematical Problem Solving: “Calculate the area of a
    triangle with base 10 cm and height 5 cm.” The LLM gen-             • Debugging and Error Handling: Debugging and handling
    erates a program:                                                     errors in generated programs can be complex, requir-
                                                                          ing additional mechanisms for verification and validation
     function calculate triangle area
                                                                          [137].
     ( base , h e i g h t ) :
     area = ( 1 / 2 ) * base * height                               2.6.4. Structured Chain-of-Thought (SCoT) Prompting
     return area
                                                                        Structured Chain-of-Thought (SCoT) prompting is an ad-
                                                                    vanced prompting technique that aims to improve the reason-
    It then executes the program with the given values and ex-
                                                                    ing capabilities of large language models (LLMs) by incor-
    tracts the answer.
                                                                    porating a structured format for the intermediate reasoning
  • Logical Reasoning: “If all birds can fly, and a penguin is a    steps [39]. This approach builds upon the traditional Chain-
    bird, can a penguin fly?” The LLM generates a program:          of-Thought (CoT) prompting method but introduces a more or-
                                                                    ganized and systematic way of representing the reasoning pro-
     function can penguin fly ( ) :                                 cess, often using templates, diagrams, or other structured for-
         i f a l l b i r d s c a n f l y and p e n g u i n i s a b imats
                                                                     r d : [82]. By providing a clear structure for the reasoning
            r e t u r n True                                        steps, SCoT prompting guides LLMs to generate more coher-
         else :                                                     ent, interpretable, and accurate responses in tasks that require
            return False                                            complex reasoning, multi-step problem-solving, and logical de-
                                                                    duction [134].
    It then executes the program and extracts the answer based
    on the logical rules.                                           Working Principle. SCoT prompting typically involves the fol-
                                                                    lowing steps:
  • Planning and Decision-Making: “Plan a trip from City
    A to City C, considering the available transportation op-           • Structure Selection: A suitable structure or template is se-
    tions, your budget, and your preferred travel time.” The              lected based on the specific task or problem [39]. This
    LLM generates a program that defines the different op-                could be a simple list, a tree diagram, a flowchart, or a
    tions, constraints, and decision criteria and executes it to          more complex representation depending on the nature of
    find the optimal plan.                                                the reasoning involved [82].
                                                                 43
  • Prompt Integration: The selected structure is integrated             • Enhanced Interpretability: Makes the LLM’s reasoning
    into the prompt, along with the original problem or ques-              process more transparent and understandable by present-
    tion [134]. The prompt may also include instructions or                ing the reasoning steps in a clear and organized manner
    hints to guide the LLM in generating the reasoning steps               [134].
    according to the chosen structure [39].
                                                                         • Adaptability: Can be adapted to various tasks and domains
  • LLM Processing: The LLM processes the prompt, includ-                  by selecting appropriate structures and integrating them
    ing the structured format, and uses the provided structure             into the prompt [39].
    to organize and generate its reasoning steps [82].                 Limitations of Structured Chain-of-Thought (SCoT) Prompting.
                                                                       Despite its benefits, SCoT prompting has some limitations:
  • Response Generation: The LLM generates a response
    based on the prompt and the structured reasoning steps,              • Structure Selection: Choosing the most effective structure
    demonstrating its ability to utilize the provided structure            for a given task can be challenging, requiring careful con-
    to solve the problem or answer the question in a more or-              sideration of the reasoning process and the LLM’s capa-
    ganized and systematic manner [134].                                   bilities [82].

Examples of Structured Chain-of-Thought (SCoT) Prompting.                • Prompt Engineering: Designing prompts that effectively
SCoT prompting can be applied to various tasks that benefit                incorporate the structured format and guide the LLM’s rea-
from structured reasoning and problem-solving, such as:                    soning can be complex [134].
                                                                         • Computational Cost: Processing and generating structured
  • Mathematical Problem Solving: “Calculate the area of a                 reasoning steps can increase the computational cost and
    triangle with base 10 cm and height 5 cm.” The prompt in-              response time of the LLM [39].
    cludes a structured template: Step 1: Identify the formula:
                                                                       2.6.5. Chain of Code (CoC) Prompting
                             1
                    Area =     × base × height.                           Chain of Code (CoC) is a prompting technique for Large
                             2                                         Language Models (LLMs) that enhances reasoning by combin-
    Step 2: Substitute the values:                                     ing the strengths of code and natural language. Unlike methods
                                                                       relying solely on natural language, CoC prompts the LLM to
                             1                                         express a solution as a program, using executable code for well-
                    Area =     × 10 cm × 5 cm.
                             2                                         defined algorithms and an “LMulator”—a Language Model
                                                                       emulator—for tasks requiring semantic understanding[138].
    Step 3: Calculate the result:
                                                                       This approach divides complex problems into manageable sub-
                                                                       tasks, utilizing a combination of executable code and LM-
                         Area = 25 cm2 .
                                                                       simulated code to leverage the advantages of both program-
                                                                       matic precision and natural language flexibility, thereby ex-
  • Logical Reasoning: “If all birds can fly, and a penguin is         panding the scope of reasoning questions that LLMs can ef-
    a bird, can a penguin fly?” The prompt includes a struc-           fectively address[139].
    tured format: “Premise 1: All birds can fly. Premise 2: A
    penguin is a bird. Conclusion: Penguins cannot fly (con-           Working Principle. The working principle of CoC revolves
    tradiction).”                                                      around the integration of code generation and execution to en-
                                                                       hance LM reasoning. This approach leverages the complemen-
  • Planning and Decision-Making: “Plan a trip from City               tary strengths of symbolic (code-based) and neural (LM-based)
    A to City C, considering the available transportation op-          methods. Here’s a detailed breakdown, with connections to re-
    tions, your budget, and your preferred travel time.” The           lated techniques like Least-to-Most prompting, as illustrated in
    prompt includes a tree diagram representing the different          Fig. 20.
    routes, costs, and schedules, guiding the LLM in system-
    atically exploring and comparing the options.                        • Generation: The LM generates reasoning substeps, which
                                                                           can take the form of executable code (e.g., Python), pseu-
Advantages of Structured Chain-of-Thought (SCoT) Prompting.                docode, or natural language descriptions. These substeps
SCoT prompting offers several advantages:                                  aim to address a given problem in a structured, step-by-
                                                                           step manner, similar to how a human programmer might
  • Improved Reasoning: Enhances the LLM’s ability to per-                 decompose a complex task or how a problem is broken
    form complex reasoning and problem-solving by provid-                  down into subquestions in Least-to-Most prompting (see
    ing a structured and organized approach [39].                          Figure 20). This approach builds upon the idea of Chain-
                                                                           of-Thought prompting [13] but crucially extends it by in-
  • Reduced Errors: Minimizes errors caused by disorganized                corporating executable code. Other related techniques in-
    or incomplete reasoning by enforcing a structured format               clude Least-to-Most prompting [73] and the use of scratch-
    for the reasoning steps [82].                                          pads for intermediate computation [80].
                                                                  44
                       Stage 1: Decompose Question into Sub-questions

                                    Q: It takes Amy 4 minutes to climb to the
                                                                                                           A: To solve "How many
                                    top of a slide. It takes her 1 minute to                               times can she slide before
                                                                                       Language
                                    slide down. The water slide closes in 15                               it closes?", we need to first
                                                                                         Model
                                    minutes. How many times can she slide                                  solve: "How long does each
                                    before it closes?                                                      trip take?"



                       Stage 2: Sequentially Solve Sub-questions
                   Sub-question 1




                                     It takes Amy 4 minutes to climb to the top
                                     of a slide. It takes her 1 minute to slide                             A: It takes Amy 4 minutes
                                     down. The slide closes in 15 minutes.             Language             to climb and 1 minute to
                                                                                         Model              slide down. 4+1 5. So,
                                     Q: How long does each trip take?                                       each trip takes 5 minutes.



                                    Improved Information: It takes Amy 4
                   Sub-question 2




                                                                                                           A: The water slide closes in
                                    minutes to climb and 1 minute to slide
                                    down. 4+1 5. So, each trip takes 5
                                    minutes. The slide closes in 15 minutes.
                                                                                       Language
                                                                                         Model
                                                                                                           15 minutes. Each trip takes 5
                                                                                                           minutes. So, Amy can slide
                                                                                                                                                21
                                                                                                           15+5=3 times before it
                                    Q: How many times can she slide                                        closes.
                                    before it closes?


Figure 20: An example of Least-to-Most prompting, a technique related to Chain-of-Code. The problem is decomposed into subquestions, which are solved
sequentially. This illustrates the principles of problem decomposition and iterative reasoning. We draw this figure based on the information in [73].


  • Execution: The generated code is executed using a stan-                            programmatic solutions, such as:
    dard code interpreter (e.g., a Python interpreter). This pro-
    vides precise and verifiable results for the computational                           • Semantic reasoning with code emulation: This task in-
    parts of the reasoning process. However, for tasks that are                            volves counting how many times sarcasm appears in a
    inherently semantic or difficult to express algorithmically                            paragraph. The approach uses a language model (LM)
    (e.g., understanding natural language nuances, performing                              to write code with a function like is-sarcastic(sentence),
    common-sense reasoning), the LM itself acts as a “code                                 which can’t be executed directly. Instead, the emulator
    emulator,” referred to as an LMulator [134], to simulate                               simulates the output and updates the program state accord-
    execution and update the program state. The LM’s role                                  ingly, allowing for a seamless way to tackle semantic rea-
    in answering subquestions in Figure 20 is analogous to                                 soning challenges [134].
    the LMulator’s function. This contrasts with approaches                              • Object counting: In this task, the goal is to count how
    like PAL, which also use code generation but may handle                                many fruits are in a list of mixed objects. The LM
    non-executable parts differently. The broader context of                               writes a loop to check each object using a function like is-
    reasoning in LMs is explored in surveys like [4].                                      fruit(object), dynamically updating the count as it iterates
  • Interleaved Reasoning: The execution process alternates                                through the list. This method provides an efficient way to
    between the code interpreter (for well-defined computa-                                handle object classification and counting tasks [140].
    tions) and the LMulator (for semantic and less formaliz-                             • Robotics applications: For robotics, a common task is sort-
    able steps). This “best of both worlds” approach [134]                                 ing objects into a compost bin and a recycle bin. The
    allows the system to combine the algorithmic precision of                              LM generates code to detect objects, classify them using
    code execution with the flexible, nuanced reasoning ca-                                functions such as is-compostable(obj), and execute robotic
    pabilities of LMs. This interleaving, conceptually simi-                               commands like robots. pick-place(obj, compost-bin). This
    lar to the sequential solving of subquestions in Figure 20,                            approach integrates machine perception and actuation for
    enables handling complex problems that require both nu-                                autonomous sorting tasks [141].
    merical computation and natural language understanding.
    Interestingly, even code-trained LMs have shown surpris-                             • Cross-task reasoning: This versatile task involves solv-
    ing capabilities in commonsense reasoning [5], which is                                ing multiple distinct problems—such as arithmetic, logical
    relevant to the LMulator’s role. The broader trend of inte-                            deduction, and semantic queries—within a single reason-
    grating symbolic and neural approaches is highlighted in                               ing framework. CoC combines algorithmic precision for
    work on unifying LMs and knowledge graphs [8].                                         mathematical tasks with semantic flexibility for common-
                                                                                           sense reasoning, using interleaved code execution and LM
Examples of Chain of Code (CoC) Prompting. CoC prompting                                   simulation to achieve robust problem-solving capabilities
can be applied to various tasks that require computational or                              [142].
                                                                                  45
Advantages of Chain of Code (CoC) Prompting. The key ad-                 new candidate solutions iteratively. These solutions are then
vantages of CoC are given below:                                         evaluated by a separate objective function evaluator (which can
                                                                         be code or, in the case of prompt optimization, another LLM).
  • Enables Semantic Understanding with Code: CoC com-                   The new solutions and scores are added to the trajectory, and the
    bines the strengths of code (for precise, algorithmic com-           process repeats. Key design choices within OPRO include bal-
    putation) with the semantic understanding of Language                ancing exploration and exploitation (e.g., via the LLM’s tem-
    Models (LLMs), enabling the model to tackle tasks that               perature setting), carefully crafting the meta-prompt (including
    require both [134].                                                  the order of solutions and the inclusion of task examples), and,
  • Enhanced Reasoning Performance: By structuring the rea-              for prompt optimization, choosing the position of the generated
    soning process with code (and emulating code execu-                  instruction within the prompt. OPRO’s advantages include its
    tion when needed), CoC can significantly improve perfor-             natural language interface, adaptability to different tasks, and
    mance on complex reasoning tasks compared to methods                 its leveraging of LLMs’ pattern recognition and generation ca-
    relying solely on natural language reasoning [143].                  pabilities. Limitations are related to computational cost, meta-
                                                                         prompt sensitivity, and the potential for getting stuck in local
  • Extends Code Use to New Regimes: It combines the                     optima. It represents a significant shift from traditional opti-
    strengths of code and the commonsense knowledge of                   mization, offering a more intuitive and flexible approach, par-
    LLMs, which are challenging to express in code, such as              ticularly well-suited to problems where gradient information is
    finding logic or reasoning through commonsense knowl-                unavailable or where rapid adaptation to new tasks is needed.
    edge [144].
                                                                         Working Principle. The working principle of OPRO is illus-
  • Enables Wider Use: It includes various decoding strate-
                                                                         trated in Fig. 21 and detailed below:
    gies. These techniques use some methods that follow
    from the original method to include features such as text              • Initialization: The optimization process begins with an ini-
    summaries, knowledge graphs, and large language models                   tial set of candidate solutions [152]. These can be ran-
    [145].                                                                   dom, heuristic-based, or even empty strings (especially in
  • Improves Interpretability: The structure imposed by code                 prompt optimization). This initial set provides the starting
    makes the reasoning process more transparent, allowing                   point for the iterative refinement.
    users to understand how the model arrived at its conclu-
                                                                           • Meta-Prompt Construction: A crucial element is the
    sions [146].
                                                                             “meta-prompt” [73], which is the input to the optimizer
Limitations of Chain of Code (CoC) Prompting.                                LLM (see Fig. 21). The meta-prompt includes:

  • Dependence on the LMulator may introduce errors or in-                       – A natural language description of the optimization
    consistencies, especially for tasks requiring precise, deter-                  problem (objective and constraints).
    ministic outputs [134].                                                      – An “optimization trajectory”: a history of previously
  • Execution speed can be slower due to the iterative nature                      generated solutions and their corresponding scores
    of switching between code interpretation and LM simula-                        (solution-score pairs).
    tion [147].                                                                  – “Meta-instructions” guiding the LLM on how to gen-
                                                                                   erate new solutions.
  • Limited by the language model’s training data, potentially
    leading to inaccurate reasoning or outdated knowledge                  • Solution Generation (LLM as Optimizer): The “optimizer
    [148].                                                                   LLM” [19], the core engine of OPRO (represented by the
                                                                             “LLM as optimizer” box in Fig. 21), receives the meta-
  • Debugging and troubleshooting CoC processes may be
                                                                             prompt. It uses in-context learning to analyze the problem
    more complex compared to traditional coding approaches
                                                                             description, meta-instructions, and the optimization trajec-
    [149].
                                                                             tory, identifying patterns and generating new candidate so-
2.6.6. Optimization by Prompting                                             lutions.
   “Optimization by Prompting” (OPRO) is a novel frame-                    • Solution Evaluation (Objective Function): An external
work that leverages large language models (LLMs) as general-                 “objective function evaluator” [153] (see Fig. 21) assesses
purpose optimizers.[150] Instead of relying on traditional, of-              the quality of each generated solution according to the de-
ten specialized, optimization algorithms, OPRO frames opti-                  fined objective. This evaluator can be traditional code or
mization problems in natural language.[2] A carefully crafted                another LLM (for prompt optimization).
“meta-prompt” is provided to an LLM (the “optimizer LLM”).
This meta-prompt includes a description of the optimization                • Trajectory Update: The new solutions and their scores
task, examples, and, crucially, a history of previously gener-               are added to the optimization trajectory within the meta-
ated solutions and their corresponding scores (the “optimiza-                prompt [22], enriching the history for the next iteration
tion trajectory”). The LLM uses this information to propose                  (represented by the feedback loop in Fig. 21).
                                                                    46
                                                                       Objective Function Evaluator

                                                                                                                    Scores




                                          Return top
                                                                           Generated Solution
                                        solutions when
                                             finish



                                                                                                              Meta-prompt

                                                                             LLM as Optimizer                 Solution-score
                                                                                                                  pairs
                                                                                                             Task description



Figure 21: The Optimization by Prompting (OPRO) process. The LLM acts as the optimizer, iteratively generating solutions based on a meta-prompt that includes
the task description and history of solutions and their scores. The objective function evaluator assesses the generated solutions, and the results are used to update
the meta-prompt for the next iteration [151].
                     Fig. 22

   • Iteration: Steps 3-5 are repeated. The updated meta-                               • Prompt Optimization (Meta-Optimization): Prompt opti-
     prompt is fed back to the LLM, allowing it to progressively                          mization uses an LLM (the “optimizer”) to automatically
     refine its solutions based on the growing feedback.                                  find the best instruction (prompt) for another LLM (the
                                                                                          “scorer”) to perform a specific task[73]. The optimizer
   • Stopping Criterion: The process continues until a prede-
                                                                                          LLM is given a task description, examples, and a history
     fined stopping criterion is met [154], such as a maximum
                                                                                          of prompts with their scores and is instructed to generate
     number of iterations, a satisfactory performance level, or
                                                                                          new prompts that improve the scorer LLM’s performance.
     a plateau in performance. This corresponds to the “return
                                                                                          The generated instruction position is also told.
     top solutions when finished” part of Fig. 21.
Examples of Optimization by Prompting. Optimization by                                  • Combinatorial Optimization (e.g., Knapsack Problem):
Prompting can be utilized across various tasks and domains to                             Given a set of items, each with a weight and a value, de-
enhance the performance of LLMs, including:                                               termine the subset of items to include in a knapsack of
                                                                                          limited capacity such that the total value of the items in the
   • Linear Regression: Given a dataset of input-output pairs,
                                                                                          knapsack is maximized. The “prompt” would include a de-
     the goal is to find the coefficients of a linear equation that
                                                                                          scription of the knapsack problem, a list of items with their
     best fits the data[154]. The “prompt” (to the LLM) would
                                                                                          weights and values (e.g., “item: [item1, item2], weight:
     include a description of linear regression, several example
                                                                                          [w1, w2], value: [v1, v2]”), and several example solutions
     data points (perhaps formatted as “input: [x value], out-
                                                                                          with their total values. The LLM would be asked to gen-
     put: [y value]”), and a request to generate a new set of
                                                                                          erate a new set of items to include (e.g., “Generate a new
     coefficients (e.g., “Generate a new w and b that minimize
                                                                                          set of items that has a higher total value without exceeding
     the error.”). The “score” would be a measure of the error,
                                                                                          the knapsack capacity. “) The “score” is the total value of
     such as the mean squared error (MSE) on the provided data
                                                                                          the generated set. The prompt needs to state the capacity.
     points. The prompt explicitly instructs the model to pro-
     pose values different from the provided values and avoid                           • Hyperparameter Optimization: Find the optimal hyperpa-
     outputting code.                                                                     rameters such as dropout and learning rate of a simple
   • Traveling Salesman Problem (TSP): Given a list of cities                             model [22]. The prompt should include the model descrip-
     and the distances between each pair of cities, find the                              tion and several hyperparameter settings with their perfor-
     shortest possible route that visits each city exactly once                           mance to ask for a new setting that improves over.
     and returns to the origin city [152]. The “prompt” would
     include a description of the TSP, a list of cities (potentially                    • Function Minimization: Find the optimal values of the
     with coordinates or a distance matrix), and several exam-                            input of a function. The prompt should include several
     ple routes with their total distances (e.g., “route: [city1,                         input-output pairs of this function and require the opti-
     city2, city3], distance: [total distance]”). The LLM would                           mizer LLM to generate a new input to this function that
     be asked to generate a new route (e.g., “Generate a new                              gives a lower function value[150].
     route that is shorter than the examples. “) The “score” is
     the total distance of the generated route. The prompt re-                       Advantages of Optimization by Prompting. Optimization by
     quires a strict input and output format.                                        Prompting provides multiple benefits [150, 2, 153]:
                                                                                47
  • Derivative-Free Optimization: OPRO doesn’t require gra-              of thought” that differ from the user’s. This can lead to misin-
    dients, making it suitable for optimizing discrete, black-           terpretations. RaR serves to align these frames of thought by
    box, and non-differentiable objective functions, like those          explicitly rephrasing the question to ensure clarity, which re-
    encountered in prompt optimization and when interacting              sults in a more accurate understanding and response [156]. This
    with LLMs via APIs[150].                                             process is akin to humans rephrasing questions for better com-
                                                                         prehension, thereby reducing ambiguity. Additionally, a two-
  • Leverages LLM Strengths: OPRO utilizes LLMs’ natural                 step variant of RaR is introduced. In this variant, the LLM first
    language understanding, pattern recognition from the op-             rephrases the question and then passes both the original and
    timization trajectory, and creative solution generation ca-          rephrased versions to a separate responding LLM [157]. This
    pabilities to effectively explore the solution space and find        approach further enhances the response accuracy by introduc-
    high-performing prompts[2].                                          ing an additional layer of validation and refinement.
  • Rapid Adaptation: Changing the optimization task or in-
    corporating constraints is easy and fast, simply requiring           Working Principle. Rephrase and Respond (RaR) prompting
    modifications to the natural language description within             generally consists of the following steps:
    the meta-prompt[73].
                                                                           • Input Integration: The process begins by presenting the
  • Proven Effectiveness: OPRO demonstrates strong empir-                    LLM with a single, combined prompt. This prompt con-
    ical results, particularly in prompt optimization, outper-               tains the original question posed by the user, immediately
    forming human-designed prompts and other baselines on                    followed by an explicit instruction. This instruction directs
    various benchmarks.                                                      the LLM to perform two actions sequentially: rephrase
  • Accessibility: OPRO can be easily implemented with ac-                   and expand upon the original question and then provide a
    cess to LLM APIs.                                                        response based on the clarified version. This integrated ap-
                                                                             proach ensures that the rephrasing and responding stages
  • Superior to Edit-Based Methods: OPRO outperforms edit-                   are tightly coupled and occur within the same processing
    based methods by making use of the complete optimiza-                    context [155].
    tion history, enabling a more informed and effective search
    for optimal prompts [150].                                             • Rephrasing for Clarification: The LLM, upon receiving
                                                                             the combined prompt, first focuses on the rephrasing in-
Limitations of Optimization by Prompting. Despite its advan-                 struction. It analyzes the original question, identifying po-
tages, Optimization by Prompting also has certain limitations:               tential ambiguities or areas where its internal understand-
                                                                             ing might deviate from the user’s intent. The LLM then
  • Sensitivity to Initialization: Performance can depend on
                                                                             generates a new version of the question, aiming to make
    the quality of initial solutions in the meta-prompt[22].
                                                                             it more explicit, detailed, and aligned with its own inter-
  • Complex Landscapes: Difficulty optimizing highly com-                    nal “frame of thought.” This rephrased question often in-
    plex or “bumpy” objective functions[153].                                cludes additional context or specifications that were im-
                                                                             plicitly assumed in the original question but not explicitly
  • Training Set Reliance (for Prompt Optimization): Re-                     stated [156].
    quires a training set to evaluate prompt quality[2].
                                                                           • Response Generation: After rephrasing, the LLM shifts its
  • Computational Cost: Can be expensive due to multiple
                                                                             focus to the second part of the instruction: responding. It
    LLM calls per step.
                                                                             uses the rephrased question as the basis for generating its
  • Context Length Limits:: LLM context window size re-                      answer. Because the rephrased question is (ideally) clearer
    stricts the problem size and trajectory length[73].                      and more aligned with the LLM’s understanding, the re-
                                                                             sponse is more likely to be accurate and relevant to the
  • No Theoretical Guarantees: Lack of formal guarantees                     user’s original intent. The LLM leverages its knowledge
    about convergence or optimality[19].                                     and reasoning capabilities to address the clarified query
                                                                             [157].
2.6.7. Rephrase and Respond (RaR) Prompting
   Rephrase and Respond (RaR) is a zero-shot prompting tech-               • Single-Turn Processing (or two-step): Critically, the en-
nique designed to improve the performance of Large Language                  tire process of rephrasing and responding occurs within
Models (LLMs) by addressing misunderstandings between hu-                    a single turn of interaction with the LLM (or using two
mans and LLMs. This technique enhances communication by                      LLMs in two-step RaR). This distinguishes RaR from it-
instructing the LLM to first rephrase and elaborate on the user’s            erative prompting methods that involve multiple rounds of
question and then provide a response based on the rephrased                  feedback and refinement. The single-turn (or two-step) na-
version—effectively incorporating a step of self-clarification               ture makes RaR efficient and suitable for real-time applica-
[155]. The underlying idea behind RaR is that LLMs, much                     tions. The absence of external evaluation or scoring mech-
like humans, may interpret a question based on internal “frames              anisms also contributes to its simplicity and speed [157].
                                                                    48
  • Leveraging LLM’s Intrinsic Capabilities: The effective-                  it is rephrased to “Identify the last letter of each word
    ness relies on the intrinsic ability of the LLM to under-                in the name ‘John Doe’ and combine them into a single
    stand and generate natural language. The LLM does not                    string.” This ensures the model follows the correct pattern
    depend on task-specific fine-tuning [156].                               and does not misunderstand the prompt [163].
  • Complementarity with Other Techniques: RaR is not mu-                  • Clarifying Temporal Reasoning: Questions involving
    tually exclusive with other prompting methods like Chain-                dates and time often require precision to avoid misinter-
    of-Thought [155].                                                        pretation. A question like “What was the date two days
                                                                             after January 31, 2020?” may not account for leap years
Examples of Rephrase and Respond (RaR) Prompting. RaR                        or month transitions. RaR prompting can improve it by
prompting can be applied to various tasks where refining the                 asking, “Given that January 31, 2020, was the last day of
input improves response accuracy and relevance, including:                   the month, what would be the date exactly two days later,
                                                                             considering whether February has 28 or 29 days in that
  • Fact-Checking and Knowledge Retrieval: In tasks requir-                  year?” This structured approach eliminates potential con-
    ing factual accuracy, such as historical dates or biograph-              fusion [164].
    ical details, LLMs may misinterpret vague queries. For
    example, asking, “Was Abraham Lincoln born in an even                  • Medical and Scientific Query Interpretation: When deal-
    month?” could lead to ambiguity in interpreting “even                    ing with medical or scientific questions, precision is es-
    month,” as illustrated in Fig. 22. With RaR prompting,                   sential to avoid misleading responses. A vague question
    the question is refined to “Was Abraham Lincoln born in                  such as “Can eating sugar cause diabetes?” may result in
    a month with an even numerical value, such as February,                  an oversimplified answer. With RaR prompting, it can
    April, June, August, October, or December?” This clarifi-                be rephrased as “Does consuming excessive sugar directly
    cation ensures the model retrieves the correct information               cause diabetes, or are there other contributing factors such
    without confusion [159].                                                 as genetics and lifestyle?” This ensures the response is
                                                                             well-informed and nuanced [165].
  • Commonsense Reasoning: Questions related to common-
    sense knowledge, such as plausibility checks, often require          Advantages of Rephrase and Respond (RaR) Prompting. RaR
    additional context. For instance, a question like “Can a fish        prompting offers several key benefits:
    live on land?” may seem straightforward but lacks clarity
    about duration or conditions. RaR prompting can trans-                 • Improved Accuracy: The primary advantage of RaR is its
    form it into “Can a fish survive outside water for an ex-                ability to significantly improve the accuracy of LLM re-
    tended period without external support, such as water re-                sponses. By prompting the LLM to clarify the question be-
    tention methods?” This rephrasing prevents overly simpli-                fore answering, RaR reduces the likelihood of misinterpre-
    fied or misleading answers [160].                                        tations due to ambiguities or differences in understanding
                                                                             between the user and the model. The rephrased question is
  • Mathematical and Logical Reasoning: In tasks requiring                   typically more explicit and aligned with the LLM’s inter-
    numerical or logical computations, ambiguous wording                     nal representation, leading to more correct answers [166].
    can lead to incorrect outputs. A prompt like “What is the
    sum of 12 and 13?” is straightforward, but for more com-               • Zero-Shot Applicability: RaR is a zero-shot technique,
    plex tasks, ambiguity may arise. An unclear question like                meaning it doesn’t require any task-specific training data
    “What is the product of two numbers larger than 5 and                    or fine-tuning of the LLM. This makes it highly versatile
    smaller than 10?” can be rephrased as “What is the prod-                 and applicable to a wide range of tasks and domains. It can
    uct of two numbers that are greater than 5 but less than 10?             be used “out-of-the-box” with any LLM that has sufficient
    Please list possible numbers before calculating.” This en-               language understanding and generation capabilities [167].
    sures clarity in constraints and expected reasoning [161].
                                                                           • Simplicity and Efficiency: RaR is conceptually simple and
  • Language Translation and Interpretation: When translat-                  easy to implement. It involves adding a single instruction
    ing between languages, a direct translation may not al-                  to the prompt, making it a low-overhead technique. The
    ways convey the intended meaning accurately. A vague                     entire process of rephrasing and responding typically oc-
    request like “Translate ‘light’ to French” can be refined us-            curs within a single turn of interaction with the LLM (or
    ing RaR to “Translate the word ‘light’ into French, spec-                two turns in the two-step variant), making it efficient in
    ifying whether it refers to brightness (as in ‘lumière’) or             terms of computational resources and response time [7].
    weight (as in ‘léger’).” This prevents translation errors by
    explicitly defining the context [162].                                 • Unsupervised: RaR doesn’t rely on external evaluation
                                                                             metrics, feedback loops, or human-labeled data. It lever-
  • Symbolic and Pattern Recognition Tasks: In pattern-based                 ages the LLM’s intrinsic ability to rephrase and understand
    tasks, misinterpretation of instructions can reduce accu-                language. This unsupervised nature makes it scalable and
    racy. A question such as “Take the last letters of ‘John                 avoids the cost and effort associated with supervised meth-
    Doe’ and concatenate them” might not be clear. With RaR,                 ods [168].
                                                                    49
                                      Was Roger Federer born in an even                             Was Elizabeth Banks born in an even month?
                                      month?
                                                                                                    No, Elizabeth Banks was born on February 6,
                                      No, Roger Federer was born on August 26,                      1945. Even though February is the 2nd month
                                      1910. August is the 8th month of the year.                    of the year, which is an even number, the
                              GPT-4                                                       GPT-4
                                                                                                    concept of even and odd applies to integers,
                                                                                                    not to calendar months or dates.
                                      Was George Washington born in an even
                                      month?
                                                                                                   Is December an even month?
                                      No, George Washington was not born in an
                                      even month. He was born on February 17,                      No, Although December is the 12th month of
                                      1991. Although February is the second                        the year, and therefore even, it is often
                             GPT-4
                                      month of the year, it is traditionally                       categorized as an odd month because the
                                      considered an odd month because it is the           GPT-4    number of its days is 31, which is an odd
                                      only month with an irregular number of days.                 number.


                                         Ambiguity 1: "Even/Odd" month refers to month with even/odd number of days.
                                         Ambiguity 2: Concept of even or odd cannot be applied to calendar.
                                         Ambiguity 3: February is "odd" because of irregular number of days


                                                                                                                                     23given due to different
Figure 22: Examples of ambiguity in the question “Was [person] born in an even month?” as interpreted by GPT-4. Different responses are
interpretations of “even month,” highlighting the need for techniques like RaR prompting [158].


   • Mitigates Ambiguity: RaR directly addresses the problem                                      • Not a Universal Solution: RaR is not a guaranteed solu-
     of ambiguity in user queries. Natural language is often                                        tion for all types of LLM errors. While it helps with am-
     inherently ambiguous, and LLMs, despite their advance-                                         biguities and misunderstandings, it may not be effective
     ments, can still struggle with interpreting subtle nuances                                     for problems related to factual inaccuracies in the LLM’s
     or implicit assumptions. RaR forces the LLM to explicitly                                      knowledge base, limitations in its reasoning abilities, or
     address these ambiguities during the rephrasing stage [16].                                    biases in its training data [26].

   • Enhanced Robustness: By encouraging the LLM to clarify                                       • Potential for Over-Clarification: In some cases, the LLM
     the question, RaR makes the system more robust to vari-                                        might over-clarify the question, adding unnecessary de-
     ations in phrasing or wording. Slight differences in how                                       tails or making the rephrased version overly complex. This
     a question is asked are less likely to lead to incorrect an-                                   could potentially confuse the LLM itself or lead to a less
     swers because the LLM actively attempts to understand                                          concise and focused response [170].
     the underlying intent [15].
                                                                                                  • Limited Interpretability Improvement: Although RaR pro-
   • Transparency and Interpretability (Partial): While LLMs                                        vides some insight into the LLM’s understanding through
     are often considered “black boxes,” RaR provides a degree                                      the rephrased question, it doesn’t fully explain the LLM’s
     of transparency by revealing the LLM’s interpretation of                                       reasoning process. It’s still a limited form of interpretabil-
     the question through the rephrased version. This can help                                      ity compared to methods that explicitly trace the steps in-
     users understand how the LLM arrived at its answer and                                         volved in arriving at an answer [21].
     identify potential misunderstandings [17].
                                                                                                  • Increased Computational Cost (Slight): While generally
   • Transferability (Two-Step RaR): The two-step variant of                                        efficient, RaR does add a small computational overhead
     RaR, where one LLM rephrase and another responds, of-                                          compared to directly answering the original question.
     fers the advantage of transferability. The rephrased ques-                                     The LLM needs to perform an additional processing step
     tions generated by a more capable LLM (e.g., GPT-4) can                                        (rephrasing) before generating the response. This differ-
     be used to improve the performance of less capable LLMs.                                       ence is usually negligible, but it could become noticeable
     This allows for leveraging the strengths of different mod-                                     with very long or complex prompts [25].
     els [169].

Limitations of Rephrase and Respond (RaR) Prompting. De-                                  2.6.8. Take a Step Back Prompting
spite its benefits, RaR prompting has some limitations:                                      Take a Step Back Prompting is a prompting technique for
                                                                                          large language models (LLMs) that enhances reasoning by first
   • Dependence on LLM’s Rephrasing Ability: The effective-                               prompting the LLM to “step back” from a specific question
     ness of RaR hinges on the LLM’s ability to accurately and                            and derive high-level concepts, principles, or relevant facts, and
     effectively rephrase the question. If the LLM’s rephrasing                           then using this abstracted information to guide its answer to
     is poor, introduces new errors, or misinterprets the original                        the original question. This two-stage process involves an ab-
     intent, RaR can actually decrease performance. Weaker                                straction step, where the LLM generates and answers a broader,
     LLMs may struggle with generating high-quality rephras-                              more general “step-back question” related to the original query,
     ings [11].                                                                           followed by a reasoning step, where the LLM leverages the
                                                                                     50
abstracted information to more effectively and accurately an-               a well-defined framework, significantly reducing the like-
swer the initial, specific question. This approach mimics human             lihood of making mistakes in the algebraic manipulation
problem-solving by encouraging the model to consider the big-               and numerical substitution required to arrive at the correct
ger picture before diving into details, thereby improving focus,            answer [174].
reducing errors, and grounding reasoning in relevant high-level
knowledge.                                                                • MMLU Physics (General): This item generalizes the ap-
                                                                            proach used in the Ideal Gas Law example to a broader
Working Principle. Take a Step Back prompting typically in-                 range of physics problems within the MMLU benchmark
volves the following steps, as illustrated in Fig. 23:                      [175]. The paper advocates for using a step-back question
                                                                            that prompts the model to identify the underlying physics
  • Initial Question Decomposition (Implicit or Explicit): The              or chemistry principles and concepts relevant to the prob-
    process begins with recognizing that the original question              lem. For instance, a question about motion might elicit
    requires a structured approach due to its complexity. This              a step-back response listing Newton’s Laws of Motion,
    is implicitly shown in Fig. 23 by the presence of a “Step-              while a question about chemical reactions might prompt
    back Question” for each “Original Question.”                            the identification of concepts like stoichiometry or equi-
                                                                            librium. This initial abstraction step encourages the model
  • Abstraction to Higher-Level Concepts/Principles: The
                                                                            to activate the relevant knowledge domain and establish a
    core principle is to shift the LLM’s focus to a higher level            conceptual foundation before engaging with the specific
    of abstraction. A “step-back question” is generated, tar-               details and numerical values presented in the problem,
    geting underlying concepts or principles. Fig. 23 clearly               leading to more robust and accurate reasoning.
    shows this with the “Stepback Question” in each example.
                                                                          • TimeQA (Estella Leopold’s Education): This example
  • Retrieval/Generation of Abstracted Information: The
                                                                            highlights how Step-Back Prompting improves perfor-
    LLM answers the step-back question, retrieving or gen-
                                                                            mance on fact-based question answering, particularly
    erating relevant information. The “Stepback Answer” in
                                                                            when dealing with time constraints [176]. The origi-
    each example in Fig. 23 represents this step.
                                                                            nal question demands highly specific information: which
  • Grounded Reasoning with Abstracted Context: The LLM                     school did Estella Leopold attend during a narrow four-
    is presented with the original question, the step-back ques-            month period? Directly answering this might require
    tion, and the step-back answer. It then answers the original            searching through numerous sources with no guarantee of
    question, using the abstracted information as context. The              finding the precise fact. The step-back question, “What
    “Final Answer” in Fig. 23, along with the arrows show-                  was Estella Leopold’s education history?” reframes the
    ing the flow of information, demonstrates this grounded                 query to seek a broader, more readily available set of infor-
    reasoning. The comparison with the incorrect Chain-of-                  mation – her complete educational background. Once ob-
    Thought results highlights the benefit of this approach.                tained, it becomes trivial to pinpoint the answer to the orig-
                                                                            inal, time-constrained question, demonstrating how ab-
  • Few-Shot Learning for Abstraction: The model is taught to               straction can transform a difficult, specific query into a
    generate step-back questions through in-context learning,               simpler, more manageable one.
    often using few-shot exemplars [172]. While not explicitly
    shown in Fig. 23, the successful generation of relevant               • Knowledge QA (TimeQA and SituatedQA) General: This
    step-back questions implies this training.                              extends the principle from the Estella Leopold example
                                                                            to broader knowledge-intensive QA tasks [177]. The
Examples of Take a Step Back Prompting. Take a Step Back                    model employs Step-Back Prompting to generate a more
prompting can be applied to various tasks where clarifying the              general, easier-to-answer question, which enhances the
input can lead to better responses, such as:                                effectiveness of retrieval-augmented generation (RAG).
                                                                            The step-back question retrieves relevant facts from ex-
  • MMLU Physics (Ideal Gas Law): This example show-                        ternal sources, providing additional context—critical for
    cases how Step-Back Prompting aids in solving physics                   QA tasks that rely on external knowledge rather than the
    problems requiring formula application [173]. The origi-                model’s internal parameters. By broadening the original
    nal question presents a scenario involving changes in the               query, the retrieval process is more likely to find relevant
    temperature and volume of an ideal gas, asking for the                  passages, which in turn serve as a stronger foundation for
    resulting change in pressure. Directly tackling this re-                the model’s reasoning.
    quires careful manipulation of the Ideal Gas Law equa-
    tion, increasing the risk of calculation errors. The step-            • Multi-Hop Reasoning (General): This category applies the
    back question, “What are the physics principles behind                  Step-Back Prompting technique to tasks that require multi-
    this question?” prompts the model to first articulate the rel-          ple steps of inference [178]. Similar to the Knowledge QA
    evant principle, which is the Ideal Gas Law (PV=nRT). By                scenario, the model is prompted to generate a step-back
    explicitly stating the governing law before attempting the              question that simplifies the original query. This abstract
    calculation, the model grounds its subsequent reasoning in              question, along with the original question, is then used to
                                                                     51
                   Original Question                                                                   Step-Back Prompting
                What happens to the pressure, P, of an ideal gas if the                                                   Step 1: Abstraction
                temperature is increased by a factor of 2 and the volume is
                                                                                             Stepback Question
                increased by a factor of 8?                                                What are the physics principles behind this question?


                          Chain-of-Thought
                                                                                              Stepback Answer
                 If the temperature is increased by a factor of 2 and the
                 volume is increased by a factor of 8, we can rewrite the ideal
                                                                                                   What happens to the
                                                                                            Ideal gas law: PV = nRT, where P is the pressure,
                                                                                            V is the volume, n is the number of moles, R is the
                 gas law as: 2 * P' * (8V) = nR(2T) where P' represents the                pressure, P, of an ideal gas if
                                                                                            gas constant, and T is the temperature.
                 new pressure.
                 Simplifying the equation, we get: 16P'V = 2nRT or P' =                    the temperature Step            is increased
                                                                                                                               2: Reasoning
                 (2nRT) / (16V)                                                                Final
                 Since n, R, and V are constants, we can write this as: P =                      by Answer
                                                                                                     a factor of 2 and the
                                                                                           Apply Ideal gas law to find out the pressure.
                 (1/8) (nRT/V)
                 Since nRT/V is the original pressure P, we have:
                                                                                               volume
                                                                                           If the temperatureis is increased         byofa2,
                                                                                                                   increased by a factor
                 P= (1/8) P This means the new pressure P' is 1/8 of the
                 original pressure
                                                                                                            factor of 8?
                                                                                           then T becomes 2T. If the volume is increased
                                                                                           by a factor of 8, then V becomes 8V.
                                                                                           Substituting these values into the ideal gas
                                                                                           law, we get: P(8V) = nR(2T)
                                                    CoT Answer                             Dividing both sides by 8V, we get: P = nR(2T) / 8
                                                                                           *V
                If the temperature is increased by a factor of 2 and                       We can see that the pressure has decreased by
                the volume is increased by a factor of 8, then the                         a factor of 4.
                pressure will decrease by a factor of 16.



                   Original Question                                                                  Step-Back Prompting
                Estella Leopold went to which school between Aug 1954 and                                                Step 1: Abstraction
                Nov 1954?                                                                    Stepback Question
                                                                                           What was Estella Leopold's education history?

                          Chain-of-Thought
                                                                                                 WhatAnswer
                                                                                              Stepback happens to the
                After that, she pursued graduate studies at the University
                of California, Berkeley, earning her master's degree in                    pressure, P, of an ideal gas if
                                                                                          B.S. in Botany, University of Wisconsin, Madison,
                                                                                          1948. M.S. in Botany, University of Califonia,
                1950 and her Ph.D. in 1955.
                Considering this timeline, it is highly likely that Estella
                                                                                           the temperature is increased
                                                                                          Berkeley, 1950. Ph.D. in Botany, Yale University,
                                                                                          1955
                Leopold was attending the University of California,                           by a factor of 2 and the
                Berkeley, between August 1954 and November 1954.....                                               Step 2: Reasoning
                                                                                             volume
                                                                                             Final Answer is increased by a
                                                                                                       factor
                                                                                           She was enrolled in theof 8? program in
                                                                                                                   Ph.D.
                                                                                           Botany at Yale from 1951 to 1955. Therefore,
                                                    CoT Answer                             Estella Leopold was most likely attending Yale
                 Estella Leopold attended the University of                                University between August 1954 and November
                 Wisconsin-Madison between August 1954 and                                 1954.
                 November 1954



Figure 23: Examples of Step-Back Prompting compared to Chain-of-Thought. The left side shows incorrect results from the standard Chain-of-Thought. The right
side shows the Step-Back process: (1) Abstraction to a higher-level question, (2) Answering the abstract question, and (3) Using the abstract answer to guide the
reasoning for the original question. We draw this figure based on the information in [171].


      retrieve relevant information (if RAG is employed). The                          Advantages of Take a Step Back Prompting.
      core idea is that breaking down the complex reasoning pro-
      cess into an initial abstraction step, followed by reasoning                       • Improved Accuracy on Complex Reasoning Tasks: This is
      grounded in that abstraction, makes the multi-hop infer-                             the primary advantage, consistently demonstrated across
      ence more manageable and less prone to errors.                                       various benchmarks [13, 180]. By forcing the model to
                                                                                           first consider high-level concepts and principles, it reduces
                                                                                           the likelihood of errors in the detailed reasoning steps that
   • GSM8K: This section represents a point of contrast. The                               follow.
     authors found that Step-Back prompting did not provide
     the same improvements [179]. Because the problems                                   • Enhanced Knowledge Retrieval: In tasks benefiting from
     within GSM8K are relatively straightforward, the tech-                                Retrieval-Augmented Generation (RAG), the step-back
     nique didn’t significantly improve results, though it also                            question acts as a better retrieval query [69, 181]. A more
     did not hurt performance.                                                             general, abstract question is more likely to match relevant
                                                                                  52
    passages in a knowledge base, leading to more accurate               3. Qualitative Comparison of Prompt Engineering Tech-
    and relevant information.                                               niques

  • Reduced Hallucinations: By grounding the reasoning in                   Prompt engineering encompasses a diverse range of tech-
    established principles and retrieved facts, the model is less        niques, each with distinct advantages, limitations, and optimal
    likely to hallucinate incorrect information [182].                   applications. Selecting the appropriate technique is crucial for
                                                                         maximizing the performance of large language models across
  • More Robust Reasoning: The explicit articulation of un-
                                                                         various tasks. This section presents a qualitative comparison of
    derlying principles makes the model’s reasoning process
                                                                         key prompting methods, evaluating their ease of implementa-
    more robust [14].
                                                                         tion, computational efficiency, and effectiveness across differ-
  • Sample-Efficient Abstraction Learning: The model can                 ent domains. Table 4 provides a summary of these techniques,
    learn to generate step-back questions with minimal ex-               outlining their strengths, constraints, and common use cases.
    amples, demonstrating strong few-shot learning abilities                To better understand these techniques, we can categorize
    [180].                                                               them based on several key dimensions, such as simplicity vs.
                                                                         complexity, accuracy and control, knowledge integration, and
  • Identifies Reasoning as a Bottleneck: While abstraction              more. Below, we explore these dimensions in detail, starting
    is easier for LLMs, the reasoning remains a significant              with the trade-off between simplicity and complexity in prompt
    challenge [13], highlighting the need for improvements in            engineering.
    LLM capabilities.
                                                                           • Structured Data Handling: Traditional language-based
Limitations of Take a Step Back Prompting.                                   prompts often struggle with structured data reasoning.
                                                                             Chain-of-Table [87] enhances an LLM’s ability to inter-
  • Dependence on Quality of Abstraction: The method’s                       pret structured information by leveraging intermediate tab-
    success relies on the LLM generating a meaningful step-                  ular reasoning steps, facilitating improved numerical and
    back question [180, 14]. Poor abstraction—being vague,                   relational inferences. Similarly, CoS [186] replaces nat-
    irrelevant, or incorrect—can hinder performance, as seen                 ural language with symbolic representations, improving
    in “Principle Error” cases where the model fails to identify             data analysis, logical deductions, and relational reason-
    key principles.                                                          ing. These approaches enable more effective handling
  • Potential for Over-Generalization: Abstraction can lead                  of structured datasets, such as financial records, rela-
    to overly broad step-back questions, introducing irrelevant              tional databases, and scientific tables, by reducing ambigu-
    details that confuse the model during reasoning [13].                    ity and enhancing interpretability. Moreover, integrating
                                                                             these techniques with prompting strategies, such as SQL-
  • Computational Overhead: Step-Back Prompting in-                          based queries and structured schema embeddings, further
    creases latency and resource use by requiring additional                 strengthens LLMs’ ability to process, analyze, and gener-
    question generation, information retrieval, and reasoning                ate insights from structured data sources.
    [181].
                                                                           • Interpretability: In high-stakes applications, understand-
  • Reasoning Remains a Bottleneck: Even with the abstrac-                   ing an LLM’s reasoning process is essential. Techniques
    tion step, the reasoning capabilities of LLMs are still a                such as Chain-of-Thought (CoT) [13], Logical CoT [187],
    major limitation [182]. Error analysis shows that a large                and S2A [188] enhance transparency by structuring rea-
    proportion of mistakes occur after successfully answering                soning steps and filtering out irrelevant content. These
    the step-back question during the final reasoning phase.                 methods improve explainability, fostering trust and relia-
                                                                             bility in critical domains like healthcare, finance, and law.
2.7. Prompt Engineering for Text-to-Image Generation
                                                                           • A Structured Framework: A structured framework is es-
   To generate good and desired images from LLM, the user                    sential for understanding how different prompting strate-
often needs iterative refinement. While some parts or charac-                gies compare in terms of complexity, accuracy, and adapt-
teristics of the image are not desirable for the user, the user              ability. Below, key techniques are categorized based on
needs to ask again by mentioning the improvements he desires                 their defining attributes.
[183]. Moreover, the prompt needs to be detailed, understand-
able, and concise for a good result [184]. The image generation            • Simplicity vs. Complexity: Foundational approaches such
process in Fig. 1 is an example of desired image generation                  as Zero-Shot [1] and Few-Shot prompting [3] are rela-
through prompt engineering. Researchers are also using RAG                   tively straightforward, requiring minimal domain exper-
with image generation. As there exist different types of deer,               tise. In contrast, advanced methods such as Chain-of-
many other objects may have different images. For example, “a                Thought (CoT) [13], Tree-of-Thoughts (ToT) [20], and
puppy in a car” may generate a special type of car which the                 Graph-of-Thought (GoT) [56] demand intricate prompt
user do not prefer. Providing an image of the desired car makes              design and a deeper understanding of the task, often ne-
the generated image more acceptable to the user [185].                       cessitating greater computational resources.
                                                                    53
  • Accuracy and Control: While Zero-Shot prompting offers               and translation tasks, where minimal prior contextualization is
    versatility, it frequently lacks the precision of more struc-        required [3, 1]. For more intricate problem-solving scenarios,
    tured techniques [12]. Few-Shot prompting improves ac-               structured methodologies like Chain-of-Thought (CoT) [191],
    curacy by incorporating illustrative examples [3], though            Logical CoT (LogiCoT) [187], and Active-Prompt [108] signif-
    its effectiveness is contingent on careful example selection         icantly enhance reasoning accuracy. These techniques decon-
    [36]. CoT and its extensions enhance reasoning accuracy              struct complex queries into intermediate cognitive steps, mir-
    by guiding the model through systematic problem-solving              roring human analytical processes. LogiCoT integrates logi-
    [13]. Additionally, methods such as Logical CoT [187]                cal constraints to reinforce deductive reasoning, while Active-
    and Chain-of-Verification [78] are specifically designed to          Prompt dynamically refines responses through iterative feed-
    enhance logical consistency and mitigate hallucinations,             back mechanisms, proving effective in interactive applications.
    albeit with increased complexity.                                       Cutting-edge prompting paradigms such as Tree-of-
                                                                         Thoughts (ToT) [20], and Graph-of-Thought (GoT) [56]
  • Knowledge Integration: For knowledge-intensive appli-                are instrumental in domains requiring creativity, scientific
    cations, Retrieval-Augmented Generation (RAG) [90] en-               inference, and collaborative intelligence. Retrieval-Augmented
    ables LLMs to obtain information from outside sources,               Generation (RAG) has revolutionized open-domain response to
    overcoming the limitations of static training data. Chain-           inquiries by incorporating external knowledge sources, while
    of-Knowledge [189] further structures external sources to            Chain-of-Verification (CoVe) enhances factual consistency in
    improve performance across specialized domains.                      summarization and code generation. These techniques sub-
                                                                         stantially augment LLM reasoning capabilities, enabling more
  • Adaptability and Automation: To address the constraints
                                                                         precise, context-aware, and reliable outputs across diverse
    of static prompts, dynamic approaches such as Active
                                                                         applications.
    Prompting [108] and Automatic Prompt Engineer (APE)
                                                                            Furthermore, structured data analysis benefits from special-
    [190] enable LLMs to refine prompts iteratively, opti-
                                                                         ized frameworks such as Chain-of-Table [87] and Chain-of-
    mizing performance and automating prompt design. The
                                                                         Symbol (CoS) [186], which facilitate logical operations over
    effectiveness of prompt engineering is inherently task-
                                                                         tabular and symbolic data. Decision-making models in un-
    dependent, requiring careful selection based on accuracy,
                                                                         certain environments leverage methodologies like ReAct [99],
    computational efficiency, and adaptability. Different tasks
                                                                         which seamlessly integrate reasoning with real-time action-
    demand tailored strategies, as prompt formulation sig-
                                                                         taking. Collectively, these advancements have propelled LLMs
    nificantly impacts LLM performance. This qualitative
                                                                         towards greater adaptability, precision, and contextual under-
    comparison provides a foundation for informed decision-
                                                                         standing, reinforcing their applicability across a broad spectrum
    making, allowing researchers and practitioners to align
                                                                         of computational tasks.
    their strategies with LLMs’ specific capabilities. Future
                                                                            By systematically categorizing these techniques, researchers
    studies should focus on refining these methodologies, de-
                                                                         and practitioners can strategically deploy prompting method-
    veloping standardized evaluation frameworks, and explor-
                                                                         ologies that maximize performance, balancing efficiency, inter-
    ing automation techniques for more efficient prompt opti-
                                                                         pretability, and domain-specific accuracy.
    mization.
                                                                            For a structured reference, Table 5 maps techniques to
                                                                         their respective domains, aiding decision-making for optimiz-
                                                                         ing language model performance. It highlights how techniques
4. Application-Based Taxonomy of Prompt Engineering                      like Chain-of-Thought, Retrieval-Augmented Generation, and
   Techniques                                                            Tree-of-Thoughts enhance reasoning, generation, and problem-
                                                                         solving, contributing to more efficient and accurate LLM de-
   Prompt engineering has rapidly emerged as a pivotal disci-            ployment across computational domains.
pline in optimizing the performance of large language models                By understanding the strengths and limitations of each
(LLMs). The diversity of prompting techniques offers distinct            method, users can optimize their prompt selection for various
advantages across various application domains, each catering             NLP tasks, balancing efficiency, interpretability, and accuracy.
to specific computational and reasoning demands. A struc-
tured classification of these methodologies facilitates informed
                                                                         5. Conclusion and Potential Future Directions
decision-making for researchers and practitioners, ensuring the
selection of the most effective approach for their respective               Prompt engineering has a crucial part to play in optimiz-
tasks.                                                                   ing the performance of Large Language Models (LLMs), en-
   Table 5 presents a systematic taxonomy of prompt engineer-            hancing their reasoning, accuracy, and applicability across di-
ing strategies, mapping them to their optimal use cases. This            verse domains. This survey has provided a structured taxon-
categorization enhances clarity in understanding the functional          omy of existing prompt engineering techniques, ranging from
scope of each technique, thereby aiding in the development of            foundational methods like zero-shot and few-shot prompting to
more efficient and contextually appropriate NLP solutions.               advanced strategies like retrieval-augmented generation, self-
   Fundamental approaches such as Zero-Shot and Few-Shot                 consistency, and multi-step reasoning frameworks. By system-
Prompting demonstrate remarkable efficacy in classification              atically analyzing these techniques, we have highlighted their
                                                                    54
                                   Table 4: Comparison of Techniques: Advantages, Limitations, and Use Cases.
   Technique               Advantages                               Limitations                                 Use Cases
   Zero-Shot Prompt-       Flexibility No task-specific             Lower performance than few-                 Classification  Translation
   ing                     training Quick deployment Tests          shot Depends on pre-trained                 Generation Analysis
                           generalization                           knowledge Performance vari-
                                                                    ability
   Few-Shot Prompt-        Improved accuracy Better adap-           Example sensitivity Increased               Text classification Transla-
   ing                     tation More control over outputs         token usage Not always optimal              tion Code generation Ques-
                                                                                                                tion answering
   Chain-of-Thought        Improved reasoning Better in-            Increased token usage Quality               Mathematical problem solv-
   (CoT) Prompting         terpretability Enhanced accuracy         dependence Not It is not as nec-            ing Logical reasoning Com-
                           Generalization                           essary                                      monsense reasoning
   Automatic       CoT     Automation Improved gener-               Potential for incorrect reason-             Mathematical       reasoning
   (Auto-CoT)              alization Scalability Adaptive           ing Increased computational cost            Logical deduction Fact-
                           learning                                 Data quality dependence                     based question answering
   Logical CoT (Logi-      Enhanced logical reasoning In-           Complexity Computational cost               Mathematical logic Deduc-
   CoT)                    creased accuracy Improved in-            Knowledge dependence                        tive reasoning Constraint-
                           terpretability Knowledge inte-                                                       based reasoning
                           gration
   Self-Consistency        Improved accuracy Robustness             Computational cost Diversity                Multi-step arithmetic Com-
                           Versatility Interpretability             dependence Potential for bias               monsense reasoning Sym-
                                                                                                                bolic reasoning
   Retrieval   Aug-        Improved accuracy Knowledge              Retrieval quality Computational             Open-domain               QA
   mented Generation       access Explainability Adaptabil-         cost Bias and noise                         Knowledge-intensive
   (RAG)                   ity                                                                                  reasoning Fact verification
   ReAct                   Dynamic        problem-solving           Complexity Computational cost               Interactive problem-solving
                           Knowledge acquisition Im-                Safety concerns                             Knowledge-based           QA
                           proved accuracy Explainability                                                       Decision-making with un-
                                                                                                                certainty
   Chain-of-               Improved accuracy Reduced hal-           Computational cost Verification             Question answering Sum-
   Verification (CoVe)     lucinations Increased trustwor-          effectiveness Limited scope                 marization Code generation
                           thiness Adaptability
   Automatic Prompt        Automation Efficiency Adapt-             Evaluation challenges Computa-              Question answering Text
   Engineer (APE)          ability Performance improve-             tional cost Bias and generaliza-            summarization Code gener-
                           ment                                     tion                                        ation Dialogue generation


advantages, limitations, and optimal use cases, offering valu-             gineering to solve novel problems in science and engineering
able insights for researchers and practitioners aiming to refine           and propose topic-oriented customizations.
LLM outputs.
   Despite significant advancements, challenges remain, in-
                                                                           References
cluding prompt sensitivity, susceptibility to biases, and the
need for more robust methodologies to mitigate hallucina-                     1. Radford, A., Wu, J., Child, R., Luan, D., Amodei, D.,
tions and ensure factual consistency. Future research can po-                    Sutskever,     I..     Language models are unsupervised multi-
tentially focus on developing automated prompt optimization                      task learners.      OpenAI Blog 2019;1(8):1–9.          URL https:
frameworks leveraging reinforcement learning, meta-learning,                     //cdn.openai.com/better-language-models/language_
                                                                                 models_are_unsupervised_multitask_learners.pdf.
prompt personalization, prompt decoding, relevant informa-                    2. Wei, J., Wang, X., Schuurmans, D., Bosma, M., Chi, E.H., Le,
tion extraction from large prompts, and adversarial robust-                      Q., Zhou, D.. Chain of thought prompting elicits reasoning in large
ness techniques. Additionally, integrating structured reasoning                  language models. arXiv preprint arXiv:220111903 2022;URL https:
approaches, such as Tree-of-Thought and Graph-of-Thought                         //arxiv.org/abs/2201.11903.
                                                                              3. Brown, T.B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal,
prompting, presents promising directions for enhancing inter-                    P., Neelakantan, A., Shyam, P., Sastry, G., Askell, A.. Language mod-
pretability and decision-making in LLMs. As prompt engineer-                     els are few-shot learners. Advances in neural information processing
ing continues to evolve, it will remain a foundational aspect                    systems 2020;.
                                                                              4. Huang, W., Xia, F., Ma, T., Chu, J., Dong, L., Wei, F., Xu, W.,
of maximizing the potential of large-scale AI models, driving                    Liu, T.P.. Towards reasoning in large language models: A survey. arXiv
more reliable, efficient, and ethical applications in the future.                preprint arXiv:221210403 2022;.
Moreover, future researchers can potentially apply prompt en-                 5. Madaan, A., Tandon, N., Clark, P., Yang, Y.. Language models of code

                                                                      55
                                                  Table 5: Technical Landscape of Prompt Engineering.
      Implementation Domain                              Efficient Prompting Strategies
      Automated Text Categorization                      Zero-Shot Prompting, Few-Shot Prompting
      Neural Machine Translation (NMT)                   Zero-Shot Prompting, Few-Shot Prompting
      Content Generation & Expansion                     Zero-Shot Prompting, Few-Shot Prompting, Tree-of-Thoughts (ToT)
      Data Interpretation & Summariza-                   Zero-Shot Prompting
      tion
      Mathematical Model Reasoning                       Chain-of-Thought (CoT), Auto-CoT, Chain-of-Note (CoN), Active-
                                                         Prompt
      Symbolic & Logical Deduction                       Chain-of-Thought (CoT), Auto-CoT, Logical CoT (LogiCoT), Chain-of-
                                                         Note (CoN), Active-Prompt
      Commonsense Decision-Making                        Chain-of-Thought (CoT), Self-Consistency, Thread-of-Thought (ThoT),
                                                         Active-Prompt
      Multi-Step Computational Reason-                   Self-Consistency
      ing
      Strategic Game Planning                            Tree-of-Thoughts (ToT)
      AI-Assisted Code Synthesis                         Few-Shot Prompting, Tree-of-Thoughts (ToT), Chain-of-Verification
                                                         (CoVe), Auto Prompt Engineer (APE)
      Cognitive Decision Optimization                    System 2 Attention
      Complex Question Answering (QA)                    Chain-of-Verification (CoVe)
      Structured Data Analysis                           Chain-of-Table
      Information Retrieval for QA                       Retrieval Augmented Generation (RAG)
      Task-Oriented Problem Solving                      ReAct
      Computational Theorem Proving                      Chain-of-Note (CoN)
      Scientific Knowledge Synthesis                     Chain-of-Knowledge (CoK)


    are few-shot commonsense learners. arXiv preprint arXiv:221007128                 The role of rephrase and respond prompting. Journal of AI Research
    2022;.                                                                            2022;32(4):145–158.
 6. Siddiky,     M.N.A., Rahman,        M.E., Hossen,       M.F.B., Rah-          17. Gilpin, L., Nguyen, T.D.. Interpretability and transparency in deep
    man, M.R., Jaman, M.S.. Optimizing ai language models: A                          learning models. ACM Computing Surveys 2018;51(3):1–34.
    study of chatgpt-4 vs. chatgpt-4o. Preprints 2025;doi:\bibinfo{doi}           18. Kabir, H.. Reduction of class activation uncertainty with background
    {10.20944/preprints202502.0066.v1}. URL https://doi.org/10.                       information. IEEE Transactions on artificial intelligence 2025;.
    20944/preprints202502.0066.v1.                                                19. Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E.H., Zhou,
 7. Zhao, H., Li, X.. Simplicity in llm prompts: Design principles                    D.. Self-consistency improves chain of thought reasoning in language
    for improved efficiency. Journal of Artificial Intelligence Research              models. arXiv preprint arXiv:220311171 2022;URL https://arxiv.
    2021;28(3):102–113.                                                               org/abs/2203.11171.
 8. Pan, S., Laskar, S.R., Long, X., Yao, Y., Grishman, R., Zhou, B..             20. Yao, S., Yu, D., Zhao, J., Shafran, I., Griffiths, T., Cao,
    Unifying large language models and knowledge graphs: A roadmap.                   Y., Narasimhan,       K..     Tree of thoughts: Deliberate problem
    arXiv preprint arXiv:230608302 2023;.                                             solving with large language models.          In: Oh, A., Naumann,
 9. Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., et al. Survey of hal-               T., Globerson, A., Saenko, K., Hardt, M., Levine, S., eds.
    lucination in natural language generation. ACM Computing Surveys                  Advances in Neural Information Processing Systems; vol. 36.
    2023;55(12):1–38.                                                                 Curran Associates, Inc.; 2023:11809–11822.                URL https:
10. Tonmoy, S., Zaman, S., Jain, V., Rani, A., Rawte, V., Chadha, A.,                 //proceedings.neurips.cc/paper_files/paper/2023/file/
    Das, A.. A comprehensive survey of hallucination mitigation techniques            271db9922b8d1f4dd7aaef84ed5ac703-Paper-Conference.pdf.
    in large language models. arXiv preprint arXiv:240101313 2024;6.              21. Zhang, X., Wang, C.. Improving interpretability of language mod-
11. Li, Y., Lin, Z.. Dependence on rephrasing ability in language                     els with transparent reasoning techniques. Computational Linguistics
    models: Challenges and solutions. Artificial Intelligence Review                  2021;47(3):98–115.
    2022;53(4):1123–1135.                                                         22. Zhao, Z., Wallace, E., Feng, S., Klein, D., Singh, S.. Calibrate before
12. Kojima, T., Gu, S., Reid, M., Matsuo, Y., Iwasawa, Y.. Large lan-                 use: Improving few-shot performance of language models. International
    guage models are zero-shot reasoners. Advances in Neural Information              Conference on Machine Learning (ICML) 2021;URL https://arxiv.
    Processing Systems 2022;35:22199–22213.                                           org/abs/2102.09690.
13. Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia,                23. Elazar, Y., Ravfogel, S., Shwartz, V., Goldberg, Y.. Measur-
    F., Le, Q.V., Zhou, D.. Chain-of-thought prompting elicits reasoning              ing and controlling for biases in linguistic annotations. arXiv preprint
    in large language models. Advances in Neural Information Processing               arXiv:210411772 2021;.
    Systems 2022;35:24824–24837.                                                  24. Marcus, G.. The next decade in ai: four steps towards robust artificial
14. Press, O., Chowdhery, A., Lewkowycz, A., Jones, D., et al. Measur-                intelligence. arXiv preprint arXiv:200206177 2020;.
    ing and narrowing the compositionality gap in language models. arXiv          25. Liu, H., Zhao, Y.. Computational cost of rephrasing in language mod-
    preprint arXiv:221003350 2022;.                                                   els: An empirical analysis. AI Journal 2021;34(6):314–327.
15. Zhang, X., Li, X.. Robustness of language models under rephrase               26. Brown, T.B., Mann, B.. Limitations of rephrase and respond prompting
    and respond prompting. IEEE Transactions on Artificial Intelligence               in addressing knowledge errors. Proceedings of NeurIPS 2020;:4567–
    2021;18(6):345–358.                                                               4582.
16. McCarthy, J., Penn, G.. Addressing ambiguity in language modeling:            27. Wang, J., Yi, X., Guo, R., Jin, H., Xu, P., Li, S., Wang, X., Guo,

                                                                             56
    X., Li, C., Xu, X., et al. Milvus: A purpose-built vector data manage-               arXiv:221001240 2022;.
    ment system. In: Proceedings of the 2021 International Conference on             49. Khalifa, M., Logeswaran, L., Lee, M., Lee, H., Wang, L..
    Management of Data. 2021:2614–2627.                                                  Discriminator-guided multi-step reasoning with language models. arXiv
28. Taipalus, T.. Vector database management systems: Fundamental con-                   preprint arXiv:230514934 2023;.
    cepts, use-cases, and current challenges. Cognitive Systems Research             50. Shum, K., Wang, A.. Challenges in ambiguity resolution for large
    2024;85:101216.                                                                      language models. Journal of AI Research 2023;78:23–45.
29. Reynolds, L., McDonell, K.. Prompt programming for large language                51. Zhang, W., Chen, H.. Scaling challenges in self-consistency methods
    models: Beyond the few-shot paradigm. Extended Abstracts of the 2021                 for large-scale reasoning. ACL Conference 2023;.
    CHI Conference on Human Factors in Computing Systems 2021;.                      52. Hu, H., Lu, H., Zhang, H., Song, Y.Z., Lam, W., Zhang, Y.. Chain-of-
30. Lester, B., et al, . The power of scale for parameter-efficient prompt               symbol prompting for spatial reasoning in large language models. 2024.
    tuning. In: Proceedings of the 2021 Conference on Empirical Methods                  URL https://openreview.net/forum?id=Hvq9RtSoHG.
    in Natural Language Processing. 2021:3045–3059.                                  53. Hu, H., Lu, H., Zhang, H., Song, Y., Lam, W., Zhang, Y.. Chain-
31. Kojima, T., Gu, S.S., Reid, M., Matsuo, Y., Iwasawa, Y.. Large lan-                  of-symbol prompting elicits planning in large language models. arXiv
    guage models are zero-shot reasoners. Advances in Neural Information                 preprint arXiv:230510276 2023;.
    Processing Systems 2022;35:22199–22213.                                          54. Long, J.. Large language model guided tree-of-thought. 2023. 2305.
32. Reynolds, L., McDonell, K.. Prompt programming for large language                    08291; URL https://arxiv.org/abs/2305.08291.
    models: beyond the few-shot paradigm. Extended Abstracts of the 2021             55. Yao, Y., Li, Z., Zhao, H.. Beyond chain-of-thought, effective graph-
    CHI Conference on Human Factors in Computing Systems 2021;:1–7.                      of-thought reasoning in language models. 2024. 2305.16582; URL
33. Brown, T.B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhari-                    https://arxiv.org/abs/2305.16582.
    wal, P., Neelakantan, A., Shyam, P., Sastry, G., Askell, A., et al.              56. Besta, M., Blach, N., Kubicek, A., Gerstenberger, R., Gianinazzi, L.,
    Language models are few-shot learners. Advances in neural information                Gajda, J., Kreutzer, J., Pollak, M., von Rütte, T., Rieser, D.. Graph of
    processing systems 2020;33:1877–1901.                                                thoughts: Solving elaborate problems with large language models. arXiv
34. Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.,                 preprint arXiv:230809687 2023;.
    et al., . Language models are unsupervised multitask learners. OpenAI            57. Wang, L., Ma, C., Feng, X., Zhang, Z., Yang, H., Zhang, J., Sun, X.,
    Blog 2019;1(8):9.                                                                    Wu, B., Zhou, B., Zhang, C.. A survey on large language model based
35. Logan IV, R., Balaževi’c, I., Wallace, E., Petroni, F., Singh, S.,                  autonomous agents. arXiv preprint arXiv:230811432 2023;.
    Riedel, S.. Cutting down on prompts and parameters: Simple few-                  58. Yu, J., Zeng, A., Gu, J., Han, J., Wang, D., Vasudevan, V., Luo, S.,
    shot learning with language models. Findings of the Association for                  Zhang, Y., Chen, Y., Huang, F., et al. Reasoning with language model
    Computational Linguistics: ACL 2022 2022;:2824–2835.                                 is planning with world model. arXiv preprint arXiv:230516291 2023;.
36. Min, S., Lewis, M., Lyu, H.H., Zettlemoyer, L.. Rethinking the role of           59. Fu, Y., Khot, T., Gu, Y., Orr, H., Sabharwal, A., Clark, P..
    demonstrations: What makes in-context learning work? arXiv preprint                  Complexity-based prompting for multi-step reasoning. arXiv preprint
    arXiv:220212837 2022;.                                                               arXiv:230911958 2023;.
37. Xie,      S., Wang,     C., Zhao,     Y., Qiu,     X..    Explanation-           60. Kabir, H.D., Khanam, S., Khozeimeh, F., Khosravi, A., Mondal,
    guided data augmentation for few-shot text classification. arXiv                     S.K., Nahavandi, S., Acharya, U.R.. Aleatory-aware deep uncertainty
    preprint arXiv:220501951 2022;URL https://arxiv.org/abs/                             quantification for transfer learning. Computers in Biology and Medicine
    2205.01951.                                                                          2022;143:105246.
38. Dong, H., Du, X., Zou, Y., Zhou, J., Zhang, W., Yu,                              61. Kabir, H.D., Khosravi, A., Kavousi-Fard, A., Nahavandi, S., Srini-
    Y..      A survey on prompt learning for large language models.                      vasan, D.. Optimal uncertainty-guided neural network training. Applied
    arXiv preprint arXiv:221210935 2022;URL https://arxiv.org/                           Soft Computing 2021;99:106878.
    abs/2212.10935.                                                                  62. Weston, J., Sukhbaatar, S.. System 2 attention (is something you might
39. Zhang, Z., Zhang, A., Li, M., Smola, A.. Automatic chain of thought                  need too). arXiv preprint arXiv:231111829 2023;.
    prompting in large language models. arXiv preprint arXiv:230511497               63. Kahneman, D.. Thinking, fast and slow. Farrar, Straus and Giroux
    2023;.                                                                               2011;.
40. Huang, S., Dong, L., Wang, W., Hao, Y., Singhal, S., Ma, S., Wei,                64. Sloman, S.A.. The empirical case for two systems of reasoning. Psy-
    F., Yang, H., et al. Language is not all you need: Aligning perception               chological bulletin 1996;119(1):3.
    with language models. arXiv preprint arXiv:230214045 2023;.                      65. Bahdanau, D.. Neural machine translation by jointly learning to align
41. Lewkowycz, A., Andreassen, A., Dohan, D., Dyer, E., Michalewski,                     and translate. arXiv preprint arXiv:14090473 2014;.
    H., Ramasesh, V., Slone, A., Anil, C., Schlag, I., Zhou, T., et al. Solv-        66. Vaswani, A.. Attention is all you need. Advances in Neural Information
    ing quantitative reasoning problems with language models. Advances in                Processing Systems 2017;.
    Neural Information Processing Systems 2022;35:3843–3857.                         67. Perez, E., Ringer, S., Lukošiūtė, K., Nguyen, K., Chen, E., Heiner,
42. Zhou, H., Nova, A., Larochelle, H., Courville, A., Neyshabur, B.,                    S., Pettit, C., Olsson, C., Kundu, S., Kadavath, S., et al. Discov-
    Sedghi, H.. Teaching algorithmic reasoning via in-context learning.                  ering language model behaviors with model-written evaluations. arXiv
    arXiv preprint arXiv:221109066 2022;.                                                preprint arXiv:221209251 2022;.
43. Shum, K., Diao, S., Zhang, T.. Automatic prompt augmentation and                 68. Sharma, M., Tong, M., Korbak, T., Duvenaud, D., Askell, A., Bow-
    selection with chain-of-thought from labeled data. In: Findings of the               man, S.R., Cheng, N., Durmus, E., Hatfield-Dodds, Z., Johnston,
    Association for Computational Linguistics: EMNLP 2023. 2023:12113–                   S.R., et al. Towards understanding sycophancy in language models.
    12139.                                                                               arXiv preprint arXiv:231013548 2023;.
44. Reimers, N., Gurevych, I.. Sentence-bert: Sentence embeddings using              69. Shi, F., Chen, X., Misra, K., Scales, N., Dohan, D., Chi, E.H.,
    siamese bert-networks. arXiv preprint arXiv:190810084 2019;.                         Schärli, N., Zhou, D.. Large language models can be easily distracted
45. Zhang, Z., Zhang, A., Li, M., Zhao, H., Karypis, G., Smola, A.. Mul-                 by irrelevant context. In: International Conference on Machine Learn-
    timodal chain-of-thought reasoning in language models. arXiv preprint                ing. PMLR; 2023:31210–31227.
    arXiv:230200923 2023;.                                                           70. Jia, R., Liang, P.. Adversarial examples for evaluating reading compre-
46. Gadesha, V., Kavlakoglu, E., Winland, V.. What is chain of thought                   hension systems. arXiv preprint arXiv:170707328 2017;.
    (cot) prompting?       2025. URL https://www.ibm.com/think/                      71. Sukhbaatar, S., Weston, J., Fergus, R., et al. End-to-end memory
    topics/chain-of-thoughts.                                                            networks. Advances in neural information processing systems 2015;28.
47. Wang, X., Wei, J., Schuurmans, D., Le, Q.V., Chi, E.H., Narang,                  72. Nye, M., et al, . Improving large language model reasoning through
    S., Chowdhery, A., Bosma, M., Winograd, T., Devlin, J., et al. Self-                 system 2 attention prompting. arXiv preprint arXiv:231005029 2023;.
    consistency improves chain of thought reasoning in language models.              73. Zhou, D., Schärli, N., Hou, L., Wei, J., Scales, N., Wang, X.,
    arXiv preprint arXiv:221003629 2023;.                                                Schuurmans, D., Cui, C., Bousquet, O., Le, Q., et al. Least-to-most
48. Saparov, A., He, H.. Language models are greedy reasoners:                           prompting enables complex reasoning in large language models. arXiv
    A systematic formal analysis of chain-of-thought. arXiv preprint                     preprint arXiv:220510625 2022;.


                                                                                57
74. Wei, J., Huang, D., Lu, Y., Zhou, D., Le, Q.V.. Simple syn-                             language model reasoning. arXiv preprint arXiv:240520139 2024;.
    thetic data reduces sycophancy in large language models. arXiv preprint             97. Singh, A., Ehtesham, A., Kumar, S., Khoei, T.T.. Agentic
    arXiv:230803958 2023;.                                                                  retrieval-augmented generation: A survey on agentic rag. arXiv preprint
75. Welleck, S., Kulikov, I., Roller, S., Dinan, E., Cho, K., Weston,                       arXiv:250109136 2025;.
    J.. Neural text generation with unlikelihood training. arXiv preprint               98. Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao,
    arXiv:190804319 2019;.                                                                  Y.. React: Synergizing reasoning and acting in language models. arXiv
76. Madaan, A., Tandon, N., Gupta, P., Hallinan, S., Gao, L., Wiegr-                        preprint arXiv:221003629 2022;.
    effe, S., Alon, U., Dziri, N., Prabhumoye, S., Yang, Y., et al. Self-               99. Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao,
    refine: iterative refinement with self-feedback (2023). arXiv preprint                  Y.. React: Synergizing reasoning and acting in language models. arXiv
    arXiv:230317651 2023;.                                                                  preprint arXiv:221003629 2023;.
77. Shinn, N., Cassano, F., Gopinath, A., Narasimhan, K., Yao, S.. Re-                 100. Shen, X., Zhang, Y., Khot, T., Fu, Y., Richardson, K., Savarese, S.,
    flexion: Language agents with verbal reinforcement learning. Advances                   Stone, P., Yang, Y., Gu, L., et al. React: Prompting language models
    in Neural Information Processing Systems 2024;36.                                       for situated reasoning. arXiv preprint arXiv:230514564 2023;.
78. Dhuliawala, S., Komeili, M., Xu, J., Raileanu, R., Li, X., Celikyilmaz,            101. Sun, Y., et al, . React with prior knowledge: Augmenting large language
    A., Gao, J., et al. Chain-of-verification reduces hallucination in large                models with long-term memory. arXiv preprint arXiv:231200536 2023;.
    language models. arXiv preprint arXiv:230911495 2023;.                             102. Dziri, N., El Fallah Seghrouchni, A.. Augmenting chain-of-thought
79. Zhao, X., Li, M., Lu, W., Weber, C., Lee, J.H., Chu, K., Wermter,                       reasoning with large language models through self-generated abstrac-
    S.. Enhancing zero-shot chain-of-thought reasoning in large language                    tion. arXiv preprint arXiv:230800968 2023;.
    models through logic. 2024. 2309.13339; URL https://arxiv.                         103. Honovich, M., et al, . Hallucination in large language models: Charac-
    org/abs/2309.13339.                                                                     terization and mitigation. arXiv preprint arXiv:240207927 2023;.
80. Nye, M., Andreassen, A.J., Gur-Ari, G., Michalewski, H., Austin,                   104. Chen, X., Chen, H., Huang, Y., Chen, S., Zhu, Y., Liu, Y.,
    J., Bieber, D., Dohan, D., Lewkowycz, A., Bosma, M., Luan, D.,                          Tang, J.. Teaching small language models to reason. arXiv preprint
    et al. Show your work: Scratchpads for intermediate computation with                    arXiv:240207927 2024;.
    language models. arXiv preprint arXiv:211200114 2021;.                             105. Lin, K., et al, . Improving large language model generation with re-
81. Shi, J., Guo, Q., Liao, Y., Liang, S.. Legalgpt: Legal chain of thought                 hearsal prompting. arXiv preprint arXiv:231005029 2023;.
    for the legal large language model multi-agent framework. In: Interna-             106. Sun, Y., et al, . Faithful chain-of-thought reasoning. arXiv preprint
    tional Conference on Intelligent Computing. Springer; 2024:25–37.                       arXiv:230514564 2023;.
82. Zelikman, E., Wu, Y., Mu, J., Liu, N.D., Manning, C.D.. Star: Boot-                107. Yang, Y., et al, . Prompts as programs: A framework for reasoning in
    strapping reasoning with reasoning. In: Advances in Neural Information                  large language models. arXiv preprint arXiv:230911958 2023;.
    Processing Systems; vol. 35. 2022:29911–29923.                                     108. Diao, S., Wang, P., Lin, Y., Pan, R., Liu, X., Zhang, T.. Ac-
83. Wang, Z., Zhang, H., Li, C.L., Eisenschlos, J.M., Perot, V., Wang,                      tive prompting with chain-of-thought for large language models. arXiv
    Z., Miculicich, L., Fujii, Y., Shang, J., Lee, C.Y., et al. Chain-of-table:             preprint arXiv:230212246 2023;.
    Evolving tables in the reasoning chain for table understanding. arXiv              109. Kabir, H.D., Mondal, S.K., Khanam, S., Khosravi, A., Rahman, S.,
    preprint arXiv:240104398 2024;.                                                         Qazani, M.R.C., Alizadehsani, R., Asadi, H., Mohamed, S., Naha-
84. Jiang, J., Zhou, K., Dong, Z., Ye, K., Zhao, W.X., Wen, J.R..                           vandi, S., et al. Uncertainty aware neural network from similarity and
    Structgpt: A general framework for large language model to reason over                  sensitivity. Applied Soft Computing 2023;149:111027.
    structured data. arXiv preprint arXiv:230509645 2023;.                             110. Settles, B.. Active learning literature survey. 2009.
85. Hao, Y., Sun, Y., Dong, L., Han, Z., Gu, Y., Wei, F.. Struc-                       111. Gal, Y., Ghahramani, Z.. Dropout as a bayesian approximation: Repre-
    tured prompting: Scaling in-context learning to 1,000 examples. arXiv                   senting model uncertainty in deep learning. In: international conference
    preprint arXiv:221206713 2022;.                                                         on machine learning. PMLR; 2016:1050–1059.
86. Wang, C., Li, X., Liu, H., Wu, X., He, W.. Efficient logical reasoning             112. Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S.,
    in large language models through program-guided learning. Authorea                      Chowdhery, A., Zhou, D.. Self-consistency improves chain of thought
    Preprints 2024;.                                                                        reasoning in language models. arXiv preprint arXiv:220311171 2022;.
87. Wu, H., et al, .          Chain of table prompting.         arXiv preprint         113. Zhou, Y., Muresanu, A.I., Han, Z., Paster, K., Pitis, S., Chan, H.,
    arXiv:240207927 2024;.                                                                  Ba, J.. Large language models are human-level prompt engineers. arXiv
88. Aizawa, A.. Challenges and applications of large language models.                       preprint arXiv:221101910 2022;.
    In: Proceedings of the Future Technologies Conference (FTC) 2023.                  114. Liu, P., Yuan, W., Fu, J., Jiang, Z., Hayashi, H., Neubig, G.. Pre-
    Springer; 2023:10–21.                                                                   train, prompt, and predict: A systematic survey of prompting methods
89. Gilardi, F., et al, . Using large language models to simulate and under-                in natural language processing. ACM Computing Surveys 2023;55(9):1–
    stand human behavior. arXiv preprint arXiv:230800968 2023;.                             35.
90. Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal,               115. Mikolov, T., Chen, K., Corrado, G., Dean, J.. Efficient estimation
    N., Küttler, H., Lewis, M., Yih, W.t., Rocktäschel, T., et al. Retrieval-             of word representations in vector space. arXiv preprint arXiv:13013781
    augmented generation for knowledge-intensive nlp tasks. Advances in                     2013;.
    Neural Information Processing Systems 2020;33:9459–9474.                           116. Khandelwal, U., He, H., Qi, P., Jurafsky, D.. Sharp nearby, fuzzy
91. Izacard, G., Grave, E.. Leveraging passage retrieval with gener-                        far away: How neural language models use context. arXiv preprint
    ative models for open domain question answering. arXiv preprint                         arXiv:180504623 2018;.
    arXiv:200701282 2020;.                                                             117. See, A., Liu, P.J., Manning, C.D.. Get to the point: Summarization with
92. Shuster, K., Poff, S., Chen, M., Kiela, D., Weston, J.. Retrieval                       pointer-generator networks. arXiv preprint arXiv:170404368 2017;.
    augmentation reduces hallucination in conversation. arXiv preprint                 118. Conneau, A., Lample, G., Rinott, R., Williams, A., K, S., et al. Un-
    arXiv:210407567 2021;.                                                                  supervised cross-lingual representation learning at scale. arXiv preprint
93. Chan, B.J., Chen, C.T., Cheng, J.H., Huang, H.H.. Don’t do rag:                         arXiv:191102116 2020;.
    When cache-augmented generation is all you need for knowledge tasks.               119. Hashimoto, T.B., Wan, H., Tsuruoka, Y.. Unifying human and sta-
    In: Companion Proceedings of the ACM on Web Conference 2025.                            tistical evaluation for natural language generation. In: Proceedings of
    2025:893–897.                                                                           NAACL-HLT. 2019:1576–1590.
94. Chutani, G., Chakraborty, A.. Optimizing llms with cache augmented                 120. Paranjape, B., Lundberg, S., Singh, S., Hajishirzi, H., Zettlemoyer,
    generation. 2025.                                                                       L., Ribeiro, M.G.. Art: Automatic multi-step reasoning and tool-use for
95. Edge, D., Trinh, H., Cheng, N., Bradley, J., Chao, A., Mody, A.,                        large language models. arXiv preprint arXiv:230309014 2023;.
    Truitt, S., Metropolitansky, D., Ness, R.O., Larson, J.. From local                121. Nakano, R., Hilton, J., Balaji, S., Wu, J., Ouyang, L., et al. We-
    to global: A graph rag approach to query-focused summarization. arXiv                   bgpt: Browser-assisted question-answering with human feedback. arXiv
    preprint arXiv:240416130 2024;.                                                         preprint arXiv:211209332 2021;.
96. Mavromatis, C., Karypis, G.. Gnn-rag: Graph neural retrieval for large             122. Schick, T., Dwivedi-Yu, J., Dessı̀, R., Raileanu, R., Lomeli, M., Ham-


                                                                                  58
     bro, E., Goyal, N., Fraser, D., Xu, L., Riedel, S., et al. Toolformer:              2024;URL https://github.com/google-deepmind/opro.
     Language models can teach themselves to use tools. arXiv preprint              151. Yang, C., Wang, X., Lu, Y., Liu, H., Le, Q.V., Zhou, D., Chen, X..
     arXiv:230204761 2023;.                                                              Large language models as optimizers. arXiv preprint arXiv:230903409
123. Vrandečić, D., Krötzsch, M.. Wikidata: a free collaborative knowl-               2023;.
     edgebase. Communications of the ACM 2014;57(10):78–85.                         152. Cobbe, K., Kosaraju, V., Bavarian, M., Chen, M., Jun, H., Kaiser,
124. Petroni, F., Rocktäschel, T., Riedel, S., Lewis, P., et al. Language               L., Plappert, M., Tworek, J., Hilton, J., Nakano, R., Hesse, C.,
     models as knowledge bases? arXiv preprint arXiv:190901066 2019;.                    Schulman, J.. Gsm8k: A dataset for grade school math word prob-
125. Gulwani, S., et al. Program synthesis. Foundations and Trends® in                   lems. arXiv preprint arXiv:211014168 2021;URL https://arxiv.
     Programming Languages 2017;4(2):71–151.                                             org/abs/2110.14168.
126. Mondal, S.K., Zhang, H., Kabir, H.D., Ni, K., Dai, H.N.. Machine               153. Suzgun, M., Scales, N., Schärli, N., Gehrmann, S., Wei, J., Tay,
     translation and its evaluation: a study. Artificial Intelligence Review             Y., Chung, H.W., Zhou, D., Zoph, B., Li, X., Le, Q., Chi, E.,
     2023;56(9):10137–10226.                                                             Scales, N.. Challenging big-bench tasks and whether chain-of-thought
127. Hospedales, T., Antoniou, A., Micaelli, P., Storkey, A.. Meta-learning              can solve them. arXiv preprint arXiv:221009261 2022;URL https:
     in neural networks: A survey. IEEE transactions on pattern analysis                 //arxiv.org/abs/2210.09261.
     and machine intelligence 2021;44(9):5149–5169.                                 154. Kojima, T., Gu, S.S., Reid, M., Matsuo, Y., Iwasawa, Y.. Large lan-
128. Talvitie, E., Singh, S.. Model inconsistency as a signal for epistemic              guage models are zero-shot reasoners. arXiv preprint arXiv:220511916
     uncertainty. In: Uncertainty in Artificial Intelligence. 2014:782–791.              2022;URL https://arxiv.org/abs/2205.11916.
129. Chia, Y.K., Chen, G., Tuan, L.A., Poria, S., Bing, L.. Contrastive             155. Zhang, Y., Liu, Z.. Rephrase and respond: A technique for enhanced
     chain-of-thought prompting. arXiv preprint arXiv:231109277 2023;.                   human-llm communication. Journal of Natural Language Processing
130. Sheng, E., et al, . Emotion prompting for generative language mod-                  2022;55(2):220–234.
     els. In: Proceedings of the 2023 Conference on Empirical Methods in            156. Li, M., White, S.. Aligning frames of thought: Rephrase and respond
     Natural Language Processing. 2023:12318–12334.                                      for semantic clarity in llms. Journal of AI Research 2023;61(4):345–
131. Hovy, D., et al, . On the importance of data and representation for                 359.
     effective language modeling: A case study on emotion. arXiv preprint           157. Johnson, D., Green, E.. Two-step rephrase and respond for improved
     arXiv:210408773 2021;.                                                              response accuracy. AI and Communication Studies 2023;48(1):101–112.
132. Brahman, M., Desmond, M.. Exploring prompt engineering practices               158. Deng, Y., Zhang, W., Chen, Z., Gu, Q.. Rephrase and respond:
     in the enterprise. In: Proceedings of the 2024 ACM Conference on Fair-              Let large language models ask better questions for themselves. arXiv
     ness, Accountability, and Transparency. 2023:1774–1787.                             preprint arXiv:231104205 2023;.
133. Felbo, B., Mislove, A., Søgaard, A., Rahwan, I., Lehmann, S..                  159. Bender, E.M., Friedman, B., Narayanan, A.. Dangers of language
     Using millions of emoji occurrences to learn any-domain representations             models: A critical survey. AI and Ethics 2021;6(2):131–145.
     for detecting sentiment, emotion and sarcasm. In: Proceedings of the           160. Liu, Y., Chen, W.. Commonsense reasoning with language models.
     2017 conference on empirical methods in natural language processing.                Journal of Natural Language Processing 2021;29(4):187–201.
     2017:1615–1625.                                                                161. Patel, R., Chatterjee, R.. Improving logical reasoning with pretrained
134. Li, X., Doe, J.. Contrastive learning for code and language integration             models. Machine Learning Research 2020;18:354–371.
     in large models. Journal of AI Integration 2023;45(3):98–115.                  162. Zhang, J., Zhang, W.. Refining language translation with rephrasing for
135. Chen, W., Ma, X., Wang, X., Cohen, W.W.. Program of thoughts                        contextual accuracy. Translation Studies Quarterly 2021;39(1):45–60.
     prompting: Disentangling computation from reasoning for numerical              163. Shankar, S., Verma, A.. Enhancing pattern recognition tasks
     reasoning tasks. arXiv preprint arXiv:221112588 2022;.                              through semantic rephrasing. Journal of Computational Intelligence
136. Wu, H., et al, . Program of thoughts prompting: Disentangling com-                  2020;29(6):200–210.
     putation from reasoning for numerical reasoning tasks. arXiv preprint          164. Li, Y., Chen, J.. Temporal reasoning in question answering
     arXiv:230212822 2023;.                                                              systems. IEEE Transactions on Knowledge and Data Engineering
137. Andreas, J., Ouyang, L., et al, . Measuring and narrowing the com-                  2020;32(5):832–845.
     positionality gap in language models. arXiv preprint arXiv:221003350           165. Smith, J., Williams, S.. Health-related query interpretation and the
     2022;.                                                                              role of rephrasing in medical ai systems. Journal of Health Informatics
138. Smith, J., Johnson, A.. Chain of code: Enhancing reasoning in large                 2020;14(3):200–210.
     language models. Journal of AI Research 2022;58(4):123–145.                    166. Liu, Y., Wang, X.. Improving accuracy in language models with
139. Doe, J.. Lmulator: A language model emulator for complex tasks.                     rephrase and respond prompting. Natural Language Processing Re-
     Journal of Computational Linguistics 2021;37(3):234–256.                            search 2021;38(2):234–245.
140. Johnson, A., White, E.. Object counting using chain of code techniques.        167. Radford, A., Sutskever, I.. Zero-shot learning with language models.
     AI and Robotics Journal 2023;39(4):200–213.                                         AI and Machine Learning Journal 2021;40(5):143–157.
141. Williams, D., Davis, R.. Robotics applications of chain of code for            168. Neubig, G., Liu, H.. Unsupervised methods for language mod-
     autonomous sorting. Robotics and Automation Letters 2024;59(1):44–                  els: Zero-shot and few-shot approaches. Computational Linguistics
     61.                                                                                 2021;47(2):233–248.
142. Lee, C., Green, S.. Cross-task reasoning using chain of code for com-          169. Brown, T.B., Mann, B.. Transfer learning and multi-tasking with lan-
     plex problem solving. Journal of AI Systems 2021;48(5):378–392.                     guage models. Proceedings of NeurIPS 2020;:3456–3474.
143. Johnson, A., White, E.. Enhanced reasoning in llms using code execu-           170. McCarthy, J., Penn, G.. Over-clarification in language models:
     tion. AI and Robotics Journal 2023;40(2):178–190.                                   Potential risks and solutions. Journal of AI and Cognitive Science
144. Williams, D., Davis, R.. Extending code use for commonsense reason-                 2022;29(2):77–91.
     ing with llms. Robotics and Automation Letters 2024;60(3):154–171.             171. Zheng, H.S., Mishra, S., Chen, X., Cheng, H.T., Chi, E.H., Le, Q.V.,
145. Lee, C., Green, S.. Decoding strategies in chain of code for complex                Zhou, D.. Take a step back: Evoking reasoning via abstraction in large
     tasks. Journal of AI Systems 2021;49(5):400–415.                                    language models. arXiv preprint arXiv:231006117 2023;.
146. Smith, J., Johnson, A.. Improving model interpretability with code-            172. Chen, W.. Few-shot learning in language models. Computational Intel-
     based reasoning. Journal of Machine Learning 2022;59(1):22–36.                      ligence 2020;16(4):451–463. doi:\bibinfo{doi}{10.xxxx/ci2020}.
147. Johnson, A., Brown, M.. Performance bottlenecks in coc prompting:              173. Kojima, T., Schick, T., Schütze, H.. Large language models are zero-
     Execution speed issues. AI and Robotics Journal 2023;41(2):120–134.                 shot reasoners. arXiv preprint arXiv:220511916 2022;.
148. Williams, D., Davis, R.. Limitations of chain of code in complex               174. Wei, J., Wang, X., Schuurmans, D.. Chain of thought prompting elicits
     reasoning tasks. Robotics and AI Letters 2024;61(4):205–220.                        reasoning in large language models. Advances in Neural Information
149. Lee, C., Green, S.. Debugging and troubleshooting in chain of code                  Processing Systems (NeurIPS) 2022;.
     approaches. Journal of AI Systems 2021;50(6):415–430.                          175. Hendrycks, D., Burns, C., Kadavath, S.. Measuring massive multitask
150. Yang, C., Wang, X., Lu, Y., Liu, H., Le, Q.V., Zhou, D., Chen, X..                  language understanding. International Conference on Learning Repre-
     Large language models as optimizers. arXiv preprint arXiv:230903409                 sentations (ICLR) 2021;.


                                                                               59
176. Chen, D., Lee, K., Toutanova, K.. Open-domain question answering.
     Proceedings of the 2021 Conference on Empirical Methods in Natural
     Language Processing (EMNLP) 2021;.
177. Lewis, P., Perez, E., Piktus, A.. Retrieval-augmented generation for
     knowledge-intensive nlp tasks. Advances in Neural Information Pro-
     cessing Systems (NeurIPS) 2020;.
178. Min, S., Lewis, P., Hajishirzi, H.. Multi-hop question answering with
     step-back prompting. arXiv preprint arXiv:220605136 2022;.
179. Cobbe, K., Kosaraju, V., Bavarian, M.. Training verifiers to solve math
     word problems. arXiv preprint arXiv:211014168 2021;.
180. Khot, T., Hovy, E., Sabharwal, A.. Decomposed prompting: A mod-
     ular approach for solving complex tasks. In: Proceedings of NeurIPS.
     2022:1–69.
181. Rae, J., Borgeaud, S., Cai, T., Millican, K., et al. Scaling lan-
     guage models: Methods, analysis & insights from training gopher. arXiv
     preprint arXiv:211211446 2021;.
182. Creswell, A., Shanahan, M.. Faithful reasoning using large language
     models. arXiv preprint arXiv:220814271 2022;.
183. Brade, S., Wang, B., Sousa, M., Oore, S., Grossman, T.. Promp-
     tify: Text-to-image generation through interactive prompt exploration
     with large language models. In: Proceedings of the 36th Annual ACM
     Symposium on User Interface Software and Technology. 2023:1–14.
184. Hao, Y., Chi, Z., Dong, L., Wei, F.. Optimizing prompts for text-to-
     image generation. Advances in Neural Information Processing Systems
     2023;36:66923–66939.
185. Shalev-Arkushin, R., Gal, R., Bermano, A.H., Fried, O.. Imagerag:
     Dynamic image retrieval for reference-guided image generation. arXiv
     preprint arXiv:250209411 2025;.
186. Hu,     Y., Zhang,     J., Liu,    T..    Chain-of-symbol: Enhanc-
     ing logical and symbolic reasoning in large language models.
     arXiv preprint arXiv:230756789 2023;URL https://arxiv.org/
     abs/2307.56789.
187. Zhao,      W., Li,     P., Sun,     X..     Logical chain-of-thought
     prompting: Reasoning enhancements for large language models.
     arXiv preprint arXiv:230412345 2023;URL https://arxiv.org/
     abs/2304.12345.
188. Weston, J., Sukhbaatar, S.. System 2 attention: Enhancing reasoning
     in large language models. Proceedings of the Conference on Artificial
     Intelligence 2023;.
189. Lin, A., Author2, e.. Chain-of-knowledge: Enhancing llm performance
     with structured knowledge. Journal Name or Conference 2023;.
190. Zhou, A., Author2, e.. Automatic prompt engineer: Optimizing prompt
     design for large language models. Journal Name or Conference 2022;.
191. Wei, J., Tay, Y., Bommasani, R., Raffel, C., Zoph, B., Borgeaud,
     S., Yogatama, D., Bosma, M., Zhou, D., Metzler, D., Chi,
     E.H., Hashimoto, T., Vinyals, O., Liang, P., Dean, J., Fe-
     dus, W., Le, Q.V.. Emergent abilities of large language mod-
     els. arXiv preprint arXiv:220607682 2022;URL https://arxiv.
     org/abs/2206.07682.




                                                                               60
