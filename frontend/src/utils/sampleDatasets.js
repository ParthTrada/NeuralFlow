// Sample datasets configuration - matched to templates
// These datasets can be used directly for training or downloaded

// MNIST-style sample data (for CNN template)
const generateMNISTSample = (numSamples = 100) => {
  const data = [];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  for (let i = 0; i < numSamples; i++) {
    const label = labels[i % 10];
    // Generate 784 features (28x28 flattened) with patterns based on digit
    const features = [];
    for (let j = 0; j < 784; j++) {
      // Create digit-like patterns
      const row = Math.floor(j / 28);
      const col = j % 28;
      const digitPattern = (parseInt(label) + 1) / 10;
      const noise = Math.random() * 0.3;
      
      // Create circular/angular patterns based on digit
      const distFromCenter = Math.sqrt((row - 14) ** 2 + (col - 14) ** 2);
      const angle = Math.atan2(row - 14, col - 14);
      const value = Math.max(0, Math.min(1, 
        digitPattern * Math.cos(angle * parseInt(label)) * (1 - distFromCenter / 20) + noise
      ));
      features.push(Math.round(value * 255));
    }
    data.push({ ...Object.fromEntries(features.map((f, idx) => [`pixel_${idx}`, f])), label });
  }
  return data;
};

// CIFAR-10 style sample data (32x32 RGB images)
const generateCIFAR10Sample = (numSamples = 100) => {
  const data = [];
  const labels = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];
  
  for (let i = 0; i < numSamples; i++) {
    const label = labels[i % 10];
    const labelIdx = i % 10;
    // Generate 3072 features (32x32x3 flattened RGB)
    const features = [];
    
    for (let j = 0; j < 3072; j++) {
      const pixelIdx = Math.floor(j / 3);
      const channel = j % 3; // 0=R, 1=G, 2=B
      const row = Math.floor(pixelIdx / 32);
      const col = pixelIdx % 32;
      
      // Create distinct color patterns for each class
      let value = 0;
      const distFromCenter = Math.sqrt((row - 16) ** 2 + (col - 16) ** 2);
      
      if (labelIdx === 0) { // airplane - blue sky, gray body
        value = channel === 2 ? 150 + Math.random() * 50 : 100 + Math.random() * 30;
      } else if (labelIdx === 1) { // automobile - red/metallic
        value = channel === 0 ? 180 + Math.random() * 50 : 50 + Math.random() * 30;
      } else if (labelIdx === 2) { // bird - brown/orange
        value = channel === 0 ? 150 + Math.random() * 50 : channel === 1 ? 100 + Math.random() * 30 : 50;
      } else if (labelIdx === 3) { // cat - orange/brown fur
        value = channel === 0 ? 180 + Math.random() * 40 : channel === 1 ? 120 + Math.random() * 30 : 80;
      } else if (labelIdx === 4) { // deer - brown
        value = channel === 0 ? 139 : channel === 1 ? 90 + Math.random() * 20 : 43;
      } else if (labelIdx === 5) { // dog - brown/golden
        value = channel === 0 ? 160 + Math.random() * 40 : channel === 1 ? 120 + Math.random() * 30 : 60;
      } else if (labelIdx === 6) { // frog - green
        value = channel === 1 ? 150 + Math.random() * 50 : 50 + Math.random() * 30;
      } else if (labelIdx === 7) { // horse - brown
        value = channel === 0 ? 120 + Math.random() * 30 : channel === 1 ? 80 + Math.random() * 20 : 40;
      } else if (labelIdx === 8) { // ship - blue water, white/gray ship
        value = channel === 2 ? 150 + Math.random() * 50 : row < 16 ? 200 : 100;
      } else { // truck - various colors
        value = 100 + Math.random() * 100;
      }
      
      // Add some structure based on distance from center
      value = value * (1 - distFromCenter / 40) + Math.random() * 30;
      features.push(Math.round(Math.max(0, Math.min(255, value))));
    }
    data.push({ ...Object.fromEntries(features.map((f, idx) => [`pixel_${idx}`, f])), label });
  }
  return data;
};

// Large Movie Reviews dataset (100 samples)
const movieReviewsData = [
  // Positive reviews
  { review: "This movie was absolutely fantastic! The acting was superb and the story kept me engaged throughout.", rating: "positive" },
  { review: "A masterpiece of cinema. Every scene was beautifully crafted and the performances were Oscar-worthy.", rating: "positive" },
  { review: "I loved every minute of this film. The director did an amazing job bringing the story to life.", rating: "positive" },
  { review: "One of the best movies I've seen this year. Highly recommend to everyone!", rating: "positive" },
  { review: "Incredible storytelling with stunning visuals. This is what great filmmaking looks like.", rating: "positive" },
  { review: "The chemistry between the leads was electric. A truly memorable romantic drama.", rating: "positive" },
  { review: "Action-packed from start to finish with a plot that actually makes sense. Loved it!", rating: "positive" },
  { review: "A heartwarming tale that will make you laugh and cry. Perfectly executed.", rating: "positive" },
  { review: "The special effects were groundbreaking and the story was equally impressive.", rating: "positive" },
  { review: "Finally a sequel that lives up to the original. Maybe even better!", rating: "positive" },
  { review: "This film restored my faith in Hollywood. Original, creative, and brilliantly acted.", rating: "positive" },
  { review: "A thrilling ride from beginning to end. The twist ending was perfect.", rating: "positive" },
  { review: "Beautiful cinematography paired with an emotionally powerful narrative.", rating: "positive" },
  { review: "The ensemble cast delivered performances that will be remembered for years.", rating: "positive" },
  { review: "A perfect blend of humor and drama. This movie has it all.", rating: "positive" },
  { review: "I've watched it three times already and it gets better each viewing.", rating: "positive" },
  { review: "The soundtrack alone is worth the ticket price. Combined with great acting, it's perfect.", rating: "positive" },
  { review: "A refreshing take on the genre. Creative, bold, and entertaining.", rating: "positive" },
  { review: "This movie exceeded all my expectations. A true cinematic achievement.", rating: "positive" },
  { review: "Gripping from the first scene to the last. Couldn't look away for a second.", rating: "positive" },
  { review: "The character development was exceptional. You really care about everyone's journey.", rating: "positive" },
  { review: "A visual feast with substance. Both beautiful and meaningful.", rating: "positive" },
  { review: "The dialogue was sharp and witty. Every conversation felt authentic.", rating: "positive" },
  { review: "An instant classic that will stand the test of time.", rating: "positive" },
  { review: "I laughed, I cried, I cheered. This movie took me on an emotional journey.", rating: "positive" },
  { review: "Brilliant direction and flawless execution. A must-see film.", rating: "positive" },
  { review: "The pacing was perfect - never a dull moment throughout the entire runtime.", rating: "positive" },
  { review: "A triumph of storytelling. The narrative structure was innovative and effective.", rating: "positive" },
  { review: "Outstanding performances from the entire cast. Everyone brought their A-game.", rating: "positive" },
  { review: "This is the kind of movie that reminds you why you love cinema.", rating: "positive" },
  { review: "Emotionally resonant and visually stunning. A complete package.", rating: "positive" },
  { review: "The script was tight and the direction was assured. Hollywood at its best.", rating: "positive" },
  { review: "A genuinely surprising film that subverts expectations in the best way.", rating: "positive" },
  { review: "I was on the edge of my seat the entire time. Absolutely thrilling!", rating: "positive" },
  // Negative reviews
  { review: "What a waste of time and money. The plot made no sense whatsoever.", rating: "negative" },
  { review: "Terrible acting and an even worse script. How did this get made?", rating: "negative" },
  { review: "I walked out halfway through. Life is too short for movies this bad.", rating: "negative" },
  { review: "The trailer was misleading. This movie was nothing like what was advertised.", rating: "negative" },
  { review: "Boring, predictable, and way too long. A complete disappointment.", rating: "negative" },
  { review: "The dialogue was cringe-worthy and the characters were one-dimensional.", rating: "negative" },
  { review: "I've seen better acting in high school plays. Truly awful performances.", rating: "negative" },
  { review: "A shameless cash grab with no artistic merit. Avoid at all costs.", rating: "negative" },
  { review: "The special effects couldn't save this trainwreck of a story.", rating: "negative" },
  { review: "Predictable from the first minute. I guessed every plot twist.", rating: "negative" },
  { review: "The pacing was all wrong - somehow both rushed and boring.", rating: "negative" },
  { review: "I want those two hours of my life back. Complete waste of time.", rating: "negative" },
  { review: "The director clearly had no vision for this project. It shows.", rating: "negative" },
  { review: "Lazy writing and uninspired direction. A forgettable mess.", rating: "negative" },
  { review: "This movie insulted my intelligence at every turn.", rating: "negative" },
  { review: "The worst sequel I've ever seen. It ruins everything the original built.", rating: "negative" },
  { review: "Choppy editing and incoherent storytelling. A technical disaster.", rating: "negative" },
  { review: "Not a single likeable character in the entire film. Who am I rooting for?", rating: "negative" },
  { review: "The humor fell completely flat. Not a single genuine laugh.", rating: "negative" },
  { review: "Overlong and self-indulgent. Someone needed to edit this down.", rating: "negative" },
  { review: "A soulless remake that misses everything that made the original special.", rating: "negative" },
  { review: "The plot holes are big enough to drive a truck through.", rating: "negative" },
  { review: "Tried way too hard to be clever and ended up being confusing.", rating: "negative" },
  { review: "The ending was so bad it ruined the few good parts that came before.", rating: "negative" },
  { review: "Generic, formulaic, and utterly forgettable. Skip this one.", rating: "negative" },
  { review: "An assault on the senses. Too loud, too flashy, and completely empty.", rating: "negative" },
  { review: "The CGI looked terrible and the story was even worse.", rating: "negative" },
  { review: "A disappointing misfire from a usually reliable director.", rating: "negative" },
  { review: "This movie commits the worst sin - it's just plain boring.", rating: "negative" },
  { review: "Poorly conceived and even more poorly executed. A total failure.", rating: "negative" },
  { review: "The tone was all over the place. Comedy? Drama? Horror? Pick one!", rating: "negative" },
  { review: "Wasted potential with a great cast stuck in a terrible script.", rating: "negative" },
  { review: "I've never been so bored watching an action movie. Impressive failure.", rating: "negative" },
  { review: "The movie thinks it's smarter than it actually is. Pretentious garbage.", rating: "negative" },
  // Neutral reviews
  { review: "It was okay. Nothing special but not terrible either.", rating: "neutral" },
  { review: "A decent way to spend an afternoon. Won't change your life though.", rating: "neutral" },
  { review: "Some good moments but also some really weak parts. Mixed bag.", rating: "neutral" },
  { review: "Average movie with average performances. It exists.", rating: "neutral" },
  { review: "Had potential but didn't quite deliver. Still watchable.", rating: "neutral" },
  { review: "Entertaining enough but forgettable. You'll enjoy it then forget it.", rating: "neutral" },
  { review: "Middle of the road filmmaking. Neither impressive nor offensive.", rating: "neutral" },
  { review: "Worth a watch on streaming but not worth a theater ticket.", rating: "neutral" },
  { review: "The first half was great, the second half not so much. Uneven.", rating: "neutral" },
  { review: "Solid B-movie fare. Knows what it is and delivers on that.", rating: "neutral" },
  { review: "Some laughs, some yawns. A thoroughly mediocre experience.", rating: "neutral" },
  { review: "Not bad, not great. Just kind of... there.", rating: "neutral" },
  { review: "The acting was good but the script let everyone down.", rating: "neutral" },
  { review: "Visually impressive but emotionally hollow. Style over substance.", rating: "neutral" },
  { review: "A competent but uninspired effort. Goes through the motions.", rating: "neutral" },
  { review: "I can see what they were going for but the execution was lacking.", rating: "neutral" },
];

// News Category Classification dataset
const newsCategoryData = [
  // Technology
  { headline: "Apple announces new iPhone with revolutionary AI features", category: "technology" },
  { headline: "Google's latest algorithm update changes search rankings significantly", category: "technology" },
  { headline: "Tesla unveils next-generation electric vehicle battery technology", category: "technology" },
  { headline: "Microsoft acquires gaming studio in billion dollar deal", category: "technology" },
  { headline: "New cybersecurity threat affects millions of users worldwide", category: "technology" },
  { headline: "Startup raises $500M to develop quantum computing solutions", category: "technology" },
  { headline: "Social media platform introduces new privacy features", category: "technology" },
  { headline: "AI-powered robots now working in warehouses across the country", category: "technology" },
  { headline: "New smartphone chip promises 50% better battery life", category: "technology" },
  { headline: "Tech giants face antitrust investigation by federal regulators", category: "technology" },
  { headline: "Virtual reality headset sales surge during holiday season", category: "technology" },
  { headline: "Cloud computing market expected to double by 2025", category: "technology" },
  { headline: "Hackers breach major retailer's customer database", category: "technology" },
  { headline: "New programming language gains popularity among developers", category: "technology" },
  { headline: "5G network expansion reaches rural communities", category: "technology" },
  { headline: "Artificial intelligence now writes code better than humans", category: "technology" },
  { headline: "Blockchain technology adopted by major financial institutions", category: "technology" },
  { headline: "Self-driving cars get approval for highway testing", category: "technology" },
  { headline: "New laptop features unprecedented 24-hour battery life", category: "technology" },
  { headline: "Tech company announces layoffs amid economic uncertainty", category: "technology" },
  // Sports
  { headline: "Lakers win championship in dramatic overtime victory", category: "sports" },
  { headline: "Tennis star announces retirement after legendary career", category: "sports" },
  { headline: "World Cup final breaks global viewership records", category: "sports" },
  { headline: "Olympic committee announces new host city for 2032 games", category: "sports" },
  { headline: "Baseball player signs record-breaking $400 million contract", category: "sports" },
  { headline: "Underdog team defeats champions in stunning upset", category: "sports" },
  { headline: "Star quarterback out for season with knee injury", category: "sports" },
  { headline: "Swimming world record shattered at national championships", category: "sports" },
  { headline: "Football league implements new safety protocols", category: "sports" },
  { headline: "Golf tournament relocated due to severe weather conditions", category: "sports" },
  { headline: "Boxing match generates $100 million in pay-per-view revenue", category: "sports" },
  { headline: "Soccer club purchased by billionaire investor group", category: "sports" },
  { headline: "Marathon runner completes race despite injury", category: "sports" },
  { headline: "Hockey team trades star player in blockbuster deal", category: "sports" },
  { headline: "Basketball league expands with two new franchises", category: "sports" },
  { headline: "Athlete suspended for violating league substance policy", category: "sports" },
  { headline: "Racing driver wins fourth consecutive championship", category: "sports" },
  { headline: "College football playoff format to expand next season", category: "sports" },
  { headline: "Gymnastics competition showcases rising young talent", category: "sports" },
  { headline: "Sports betting legalized in three more states", category: "sports" },
  // Business
  { headline: "Stock market reaches all-time high amid economic optimism", category: "business" },
  { headline: "Federal Reserve announces interest rate decision", category: "business" },
  { headline: "Major airline files for bankruptcy protection", category: "business" },
  { headline: "Retail giant reports record quarterly earnings", category: "business" },
  { headline: "Oil prices surge following Middle East tensions", category: "business" },
  { headline: "Housing market shows signs of cooling after hot streak", category: "business" },
  { headline: "Cryptocurrency exchange launches new trading platform", category: "business" },
  { headline: "Automaker recalls millions of vehicles over safety concerns", category: "business" },
  { headline: "Merger creates world's largest pharmaceutical company", category: "business" },
  { headline: "Unemployment rate drops to lowest level in decades", category: "business" },
  { headline: "Trade deal reached between major economic powers", category: "business" },
  { headline: "Bank announces new credit card with enhanced rewards", category: "business" },
  { headline: "Energy company invests billions in renewable projects", category: "business" },
  { headline: "Consumer spending increases despite inflation concerns", category: "business" },
  { headline: "Startup goes public with $10 billion valuation", category: "business" },
  { headline: "Supply chain disruptions continue to affect manufacturers", category: "business" },
  { headline: "Real estate investment trust acquires office buildings", category: "business" },
  { headline: "CEO steps down amid accounting scandal allegations", category: "business" },
  { headline: "Small business loans program receives additional funding", category: "business" },
  { headline: "Insurance company raises premiums for coastal properties", category: "business" },
  // Entertainment
  { headline: "Blockbuster movie breaks opening weekend box office record", category: "entertainment" },
  { headline: "Music streaming service reaches 200 million subscribers", category: "entertainment" },
  { headline: "Award-winning actor joins cast of highly anticipated sequel", category: "entertainment" },
  { headline: "Hit TV series renewed for three more seasons", category: "entertainment" },
  { headline: "Pop star announces world tour spanning 50 cities", category: "entertainment" },
  { headline: "Film festival announces lineup of premiere screenings", category: "entertainment" },
  { headline: "Video game release breaks sales records on launch day", category: "entertainment" },
  { headline: "Celebrity couple announces engagement on social media", category: "entertainment" },
  { headline: "Legendary band reunites for anniversary concert tour", category: "entertainment" },
  { headline: "Streaming platform orders new original series", category: "entertainment" },
  { headline: "Broadway show wins multiple Tony Awards", category: "entertainment" },
  { headline: "Album debuts at number one on music charts worldwide", category: "entertainment" },
  { headline: "Director reveals plot details for upcoming superhero film", category: "entertainment" },
  { headline: "Reality TV show casting call attracts thousands of applicants", category: "entertainment" },
  { headline: "Comedian's stand-up special becomes most-watched ever", category: "entertainment" },
  { headline: "Music festival announces star-studded performer lineup", category: "entertainment" },
  { headline: "Animated film studio announces slate of upcoming projects", category: "entertainment" },
  { headline: "Actor wins lifetime achievement award at ceremony", category: "entertainment" },
  { headline: "Podcast network acquired by media conglomerate", category: "entertainment" },
  { headline: "Concert venue opens after major renovation project", category: "entertainment" },
];

// Shakespeare character-level text generation dataset (for Mini-GPT template)
const shakespeareText = `ROMEO: But, soft! what light through yonder window breaks?
It is the east, and Juliet is the sun.
Arise, fair sun, and kill the envious moon,
Who is already sick and pale with grief,
That thou her maid art far more fair than she:
Be not her maid, since she is envious;
Her vestal livery is but sick and green
And none but fools do wear it; cast it off.
It is my lady, O, it is my love!
O, that she knew she were!
She speaks yet she says nothing: what of that?
Her eye discourses; I will answer it.
I am too bold, 'tis not to me she speaks:
Two of the fairest stars in all the heaven,
Having some business, do entreat her eyes
To twinkle in their spheres till they return.
What if her eyes were there, they in her head?
The brightness of her cheek would shame those stars,
As daylight doth a lamp; her eyes in heaven
Would through the airy region stream so bright
That birds would sing and think it were not night.
See, how she leans her cheek upon her hand!
O, that I were a glove upon that hand,
That I might touch that cheek!

JULIET: Ay me!

ROMEO: She speaks:
O, speak again, bright angel! for thou art
As glorious to this night, being o'er my head
As is a winged messenger of heaven.

JULIET: O Romeo, Romeo! wherefore art thou Romeo?
Deny thy father and refuse thy name;
Or, if thou wilt not, be but sworn my love,
And I'll no longer be a Capulet.

ROMEO: Shall I hear more, or shall I speak at this?

JULIET: 'Tis but thy name that is my enemy;
Thou art thyself, though not a Montague.
What's Montague? it is nor hand, nor foot,
Nor arm, nor face, nor any other part
Belonging to a man. O, be some other name!
What's in a name? that which we call a rose
By any other name would smell as sweet;
So Romeo would, were he not Romeo call'd,
Retain that dear perfection which he owes
Without that title. Romeo, doff thy name,
And for that name which is no part of thee
Take all myself.

ROMEO: I take thee at thy word:
Call me but love, and I'll be new baptized;
Henceforth I never will be Romeo.

HAMLET: To be, or not to be: that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles,
And by opposing end them? To die: to sleep;
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to, 'tis a consummation
Devoutly to be wish'd. To die, to sleep;
To sleep: perchance to dream: ay, there's the rub;
For in that sleep of death what dreams may come
When we have shuffled off this mortal coil,
Must give us pause: there's the respect
That makes calamity of so long life;
For who would bear the whips and scorns of time,
The oppressor's wrong, the proud man's contumely,
The pangs of despised love, the law's delay,
The insolence of office and the spurns
That patient merit of the unworthy takes,
When he himself might his quietus make
With a bare bodkin? who would fardels bear,
To grunt and sweat under a weary life,
But that the dread of something after death,
The undiscover'd country from whose bourn
No traveller returns, puzzles the will
And makes us rather bear those ills we have
Than fly to others that we know not of?
Thus conscience does make cowards of us all;
And thus the native hue of resolution
Is sicklied o'er with the pale cast of thought,
And enterprises of great pith and moment
With this regard their currents turn awry,
And lose the name of action.

MACBETH: Tomorrow, and tomorrow, and tomorrow,
Creeps in this petty pace from day to day,
To the last syllable of recorded time;
And all our yesterdays have lighted fools
The way to dusty death. Out, out, brief candle!
Life's but a walking shadow, a poor player
That struts and frets his hour upon the stage
And then is heard no more. It is a tale
Told by an idiot, full of sound and fury,
Signifying nothing.

KING LEAR: Blow, winds, and crack your cheeks! rage! blow!
You cataracts and hurricanoes, spout
Till you have drench'd our steeples, drown'd the cocks!
You sulphurous and thought-executing fires,
Vaunt-couriers to oak-cleaving thunderbolts,
Singe my white head! And thou, all-shaking thunder,
Smite flat the thick rotundity o' the world!
Crack nature's moulds, an germens spill at once,
That make ingrateful man!

PROSPERO: Our revels now are ended. These our actors,
As I foretold you, were all spirits and
Are melted into air, into thin air:
And, like the baseless fabric of this vision,
The cloud-capp'd towers, the gorgeous palaces,
The solemn temples, the great globe itself,
Ye all which it inherit, shall dissolve
And, like this insubstantial pageant faded,
Leave not a rack behind. We are such stuff
As dreams are made on, and our little life
Is rounded with a sleep.

OTHELLO: It is the cause, it is the cause, my soul,
Let me not name it to you, you chaste stars!
It is the cause. Yet I'll not shed her blood;
Nor scar that whiter skin of hers than snow,
And smooth as monumental alabaster.
Yet she must die, else she'll betray more men.
Put out the light, and then put out the light.

ANTONY: Friends, Romans, countrymen, lend me your ears;
I come to bury Caesar, not to praise him.
The evil that men do lives after them;
The good is oft interred with their bones;
So let it be with Caesar. The noble Brutus
Hath told you Caesar was ambitious:
If it were so, it was a grievous fault,
And grievously hath Caesar answer'd it.
Here, under leave of Brutus and the rest
For Brutus is an honourable man;
So are they all, all honourable men
Come I to speak in Caesar's funeral.
He was my friend, faithful and just to me:
But Brutus says he was ambitious;
And Brutus is an honourable man.`;

// Generate character-level training data from Shakespeare text
const generateShakespeareData = (seqLength = 64) => {
  // Get unique characters (vocabulary)
  const chars = [...new Set(shakespeareText.split(''))].sort();
  const charToIdx = Object.fromEntries(chars.map((c, i) => [c, i]));
  const idxToChar = Object.fromEntries(chars.map((c, i) => [i, c]));
  
  const data = [];
  const text = shakespeareText;
  
  // Create training sequences
  for (let i = 0; i < text.length - seqLength; i += Math.floor(seqLength / 2)) {
    const inputSeq = text.slice(i, i + seqLength);
    const targetChar = text[i + seqLength];
    
    // Convert to indices
    const inputIndices = inputSeq.split('').map(c => charToIdx[c]);
    const targetIdx = charToIdx[targetChar];
    
    data.push({
      input: inputSeq,
      input_indices: inputIndices.join(','),
      target: targetChar,
      target_idx: targetIdx
    });
    
    if (data.length >= 200) break; // Limit samples for browser performance
  }
  
  return {
    sequences: data,
    vocab: chars,
    vocabSize: chars.length,
    charToIdx,
    idxToChar,
    seqLength
  };
};

// Intent Classification dataset (for chatbots)
const intentClassificationData = [
  // Greeting
  { text: "Hello there!", intent: "greeting" },
  { text: "Hi, how are you?", intent: "greeting" },
  { text: "Good morning!", intent: "greeting" },
  { text: "Hey, what's up?", intent: "greeting" },
  { text: "Howdy!", intent: "greeting" },
  { text: "Good afternoon!", intent: "greeting" },
  { text: "Hi there, nice to meet you", intent: "greeting" },
  { text: "Hello, is anyone there?", intent: "greeting" },
  { text: "Hey, good to see you", intent: "greeting" },
  { text: "Greetings!", intent: "greeting" },
  // Goodbye
  { text: "Goodbye!", intent: "goodbye" },
  { text: "See you later", intent: "goodbye" },
  { text: "Bye bye", intent: "goodbye" },
  { text: "Take care!", intent: "goodbye" },
  { text: "Have a nice day", intent: "goodbye" },
  { text: "Talk to you soon", intent: "goodbye" },
  { text: "Catch you later", intent: "goodbye" },
  { text: "I'm leaving now, bye", intent: "goodbye" },
  { text: "Thanks, goodbye!", intent: "goodbye" },
  { text: "That's all for now, bye", intent: "goodbye" },
  // Help
  { text: "I need help", intent: "help" },
  { text: "Can you assist me?", intent: "help" },
  { text: "I'm having trouble", intent: "help" },
  { text: "Something isn't working", intent: "help" },
  { text: "I don't understand how to use this", intent: "help" },
  { text: "Can someone help me please?", intent: "help" },
  { text: "I'm stuck and need assistance", intent: "help" },
  { text: "Help me out here", intent: "help" },
  { text: "I have a problem", intent: "help" },
  { text: "I need some support", intent: "help" },
  // Order Status
  { text: "Where is my order?", intent: "order_status" },
  { text: "Can you track my package?", intent: "order_status" },
  { text: "When will my order arrive?", intent: "order_status" },
  { text: "I want to check my order status", intent: "order_status" },
  { text: "Has my package shipped yet?", intent: "order_status" },
  { text: "What's the delivery status?", intent: "order_status" },
  { text: "My order hasn't arrived yet", intent: "order_status" },
  { text: "Can I get an update on my shipment?", intent: "order_status" },
  { text: "Track my recent order please", intent: "order_status" },
  { text: "Is my package on the way?", intent: "order_status" },
  // Refund
  { text: "I want a refund", intent: "refund" },
  { text: "How do I get my money back?", intent: "refund" },
  { text: "I'd like to return this and get a refund", intent: "refund" },
  { text: "Can I have my payment returned?", intent: "refund" },
  { text: "I need to cancel and get refunded", intent: "refund" },
  { text: "The product was defective, I want a refund", intent: "refund" },
  { text: "Please process my refund request", intent: "refund" },
  { text: "How long does a refund take?", intent: "refund" },
  { text: "I haven't received my refund yet", intent: "refund" },
  { text: "Initiate a refund for my order", intent: "refund" },
  // Pricing
  { text: "How much does it cost?", intent: "pricing" },
  { text: "What are your prices?", intent: "pricing" },
  { text: "Can you tell me the price?", intent: "pricing" },
  { text: "Is there a discount available?", intent: "pricing" },
  { text: "What's the total cost?", intent: "pricing" },
  { text: "Do you have any deals?", intent: "pricing" },
  { text: "Are there any promotions right now?", intent: "pricing" },
  { text: "How much for the premium plan?", intent: "pricing" },
  { text: "What are the subscription fees?", intent: "pricing" },
  { text: "Is there a free trial?", intent: "pricing" },
];

// Iris dataset (for Simple MLP template)
const irisData = [
  { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.7, sepal_width: 3.2, petal_length: 1.3, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.6, sepal_width: 3.1, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.0, sepal_width: 3.6, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.9, petal_length: 1.7, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 4.6, sepal_width: 3.4, petal_length: 1.4, petal_width: 0.3, species: 'setosa' },
  { sepal_length: 5.0, sepal_width: 3.4, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.4, sepal_width: 2.9, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.9, sepal_width: 3.1, petal_length: 1.5, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.7, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.8, sepal_width: 3.4, petal_length: 1.6, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.8, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 4.3, sepal_width: 3.0, petal_length: 1.1, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 5.8, sepal_width: 4.0, petal_length: 1.2, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.7, sepal_width: 4.4, petal_length: 1.5, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.9, petal_length: 1.3, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.9, sepal_width: 3.1, petal_length: 4.9, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 5.5, sepal_width: 2.3, petal_length: 4.0, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.5, sepal_width: 2.8, petal_length: 4.6, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 5.7, sepal_width: 2.8, petal_length: 4.5, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.3, sepal_width: 3.3, petal_length: 4.7, petal_width: 1.6, species: 'versicolor' },
  { sepal_length: 4.9, sepal_width: 2.4, petal_length: 3.3, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 6.6, sepal_width: 2.9, petal_length: 4.6, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 5.2, sepal_width: 2.7, petal_length: 3.9, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.0, sepal_width: 2.0, petal_length: 3.5, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 5.9, sepal_width: 3.0, petal_length: 4.2, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.0, sepal_width: 2.2, petal_length: 4.0, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 6.1, sepal_width: 2.9, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.6, sepal_width: 2.9, petal_length: 3.6, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.7, sepal_width: 3.1, petal_length: 4.4, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.6, sepal_width: 3.0, petal_length: 4.5, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5, species: 'virginica' },
  { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9, species: 'virginica' },
  { sepal_length: 7.1, sepal_width: 3.0, petal_length: 5.9, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 6.3, sepal_width: 2.9, petal_length: 5.6, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 6.5, sepal_width: 3.0, petal_length: 5.8, petal_width: 2.2, species: 'virginica' },
  { sepal_length: 7.6, sepal_width: 3.0, petal_length: 6.6, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 4.9, sepal_width: 2.5, petal_length: 4.5, petal_width: 1.7, species: 'virginica' },
  { sepal_length: 7.3, sepal_width: 2.9, petal_length: 6.3, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 6.7, sepal_width: 2.5, petal_length: 5.8, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 7.2, sepal_width: 3.6, petal_length: 6.1, petal_width: 2.5, species: 'virginica' },
  { sepal_length: 6.5, sepal_width: 3.2, petal_length: 5.1, petal_width: 2.0, species: 'virginica' },
  { sepal_length: 6.4, sepal_width: 2.7, petal_length: 5.3, petal_width: 1.9, species: 'virginica' },
  { sepal_length: 6.8, sepal_width: 3.0, petal_length: 5.5, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 5.7, sepal_width: 2.5, petal_length: 5.0, petal_width: 2.0, species: 'virginica' },
  { sepal_length: 5.8, sepal_width: 2.8, petal_length: 5.1, petal_width: 2.4, species: 'virginica' },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 5.3, petal_width: 2.3, species: 'virginica' },
];

// Sentiment Analysis dataset (for Text Classifier template)
const sentimentData = [
  { text: "I absolutely love this product! It exceeded all my expectations.", sentiment: "positive" },
  { text: "This is the best purchase I've ever made. Highly recommend!", sentiment: "positive" },
  { text: "Amazing quality and fast shipping. Will buy again!", sentiment: "positive" },
  { text: "Fantastic experience from start to finish. Five stars!", sentiment: "positive" },
  { text: "Great value for money. Works perfectly as described.", sentiment: "positive" },
  { text: "The customer service was outstanding and very helpful.", sentiment: "positive" },
  { text: "I'm so happy with this purchase. It's exactly what I needed.", sentiment: "positive" },
  { text: "Excellent product quality. Would recommend to everyone.", sentiment: "positive" },
  { text: "This made my life so much easier. Thank you!", sentiment: "positive" },
  { text: "Perfect fit and great design. Love it!", sentiment: "positive" },
  { text: "Wonderful product! My whole family loves it.", sentiment: "positive" },
  { text: "Best decision I ever made buying this. So satisfied!", sentiment: "positive" },
  { text: "Incredible quality at an affordable price point.", sentiment: "positive" },
  { text: "Shipped fast and works great. Very pleased!", sentiment: "positive" },
  { text: "Exceeded my expectations in every way possible.", sentiment: "positive" },
  { text: "Terrible product. Broke after one day of use.", sentiment: "negative" },
  { text: "Complete waste of money. Do not buy this!", sentiment: "negative" },
  { text: "Very disappointed with the quality. Returning it.", sentiment: "negative" },
  { text: "The worst purchase I've ever made. Total garbage.", sentiment: "negative" },
  { text: "Does not work as advertised. Very misleading.", sentiment: "negative" },
  { text: "Poor quality materials and terrible construction.", sentiment: "negative" },
  { text: "Customer service was unhelpful and rude.", sentiment: "negative" },
  { text: "Arrived damaged and company won't refund me.", sentiment: "negative" },
  { text: "This is a scam. Save your money.", sentiment: "negative" },
  { text: "Completely useless product. Very frustrated.", sentiment: "negative" },
  { text: "Cheap quality and falls apart easily.", sentiment: "negative" },
  { text: "Not worth the price at all. Big regret.", sentiment: "negative" },
  { text: "Product looks nothing like the pictures shown.", sentiment: "negative" },
  { text: "Stopped working after a week. Very disappointing.", sentiment: "negative" },
  { text: "I want my money back. This is terrible.", sentiment: "negative" },
  { text: "It's okay, nothing special. Does the job.", sentiment: "neutral" },
  { text: "Average product. Not great, not terrible.", sentiment: "neutral" },
  { text: "Works as expected. Nothing more, nothing less.", sentiment: "neutral" },
  { text: "Decent quality for the price point.", sentiment: "neutral" },
  { text: "It's fine. Meets basic requirements.", sentiment: "neutral" },
  { text: "Neither impressed nor disappointed with this.", sentiment: "neutral" },
  { text: "Standard product. Gets the job done.", sentiment: "neutral" },
  { text: "Acceptable quality. Could be better.", sentiment: "neutral" },
  { text: "Meh. It's alright I suppose.", sentiment: "neutral" },
  { text: "Average experience overall. Nothing special.", sentiment: "neutral" },
  { text: "The product is satisfactory but unremarkable.", sentiment: "neutral" },
  { text: "It works but there's room for improvement.", sentiment: "neutral" },
  { text: "Middle of the road product. Okay value.", sentiment: "neutral" },
  { text: "Neither good nor bad. Just average.", sentiment: "neutral" },
  { text: "Does what it says but nothing more.", sentiment: "neutral" },
];

// Time Series dataset (for RNN/LSTM template)
const generateTimeSeriesData = (numSamples = 150) => {
  const data = [];
  const classes = ['up_trend', 'down_trend', 'stable'];
  
  for (let i = 0; i < numSamples; i++) {
    const classIdx = i % 3;
    const className = classes[classIdx];
    
    // Generate 9 features for each timestep
    for (let t = 0; t < 10; t++) {
      const row = {};
      for (let f = 0; f < 9; f++) {
        let baseValue;
        if (classIdx === 0) {
          // Upward trend
          baseValue = 50 + t * 5 + f * 2 + Math.random() * 10;
        } else if (classIdx === 1) {
          // Downward trend
          baseValue = 100 - t * 5 - f * 2 + Math.random() * 10;
        } else {
          // Stable with oscillation
          baseValue = 75 + Math.sin(t + f) * 10 + Math.random() * 5;
        }
        row[`feature_${f + 1}`] = Math.round(baseValue * 100) / 100;
      }
      row.trend = className;
      data.push(row);
    }
  }
  return data;
};

// SMS Spam dataset (for Text Classifier template)
const smsSpamData = [
  { message: "Congratulations! You've won a free iPhone. Click here to claim now!", label: "spam" },
  { message: "URGENT: Your account has been compromised. Verify immediately!", label: "spam" },
  { message: "FREE MONEY! No credit check required. Apply now!", label: "spam" },
  { message: "You have been selected for a cash prize of $1000!", label: "spam" },
  { message: "Limited time offer! Buy one get ten free! Act now!", label: "spam" },
  { message: "Your loan has been approved! Call this number immediately!", label: "spam" },
  { message: "Win big cash prizes by clicking this link right now!", label: "spam" },
  { message: "ALERT: Suspicious activity detected. Confirm your identity.", label: "spam" },
  { message: "Get rich quick! No experience needed. Start today!", label: "spam" },
  { message: "You're our lucky winner! Claim your prize before it expires!", label: "spam" },
  { message: "Hey, are we still meeting for lunch tomorrow?", label: "ham" },
  { message: "Can you pick up some milk on your way home?", label: "ham" },
  { message: "Thanks for dinner last night! Had a great time.", label: "ham" },
  { message: "Meeting rescheduled to 3pm. See you then!", label: "ham" },
  { message: "Happy birthday! Hope you have an amazing day!", label: "ham" },
  { message: "Running late, be there in 10 minutes.", label: "ham" },
  { message: "Don't forget we have that appointment tomorrow.", label: "ham" },
  { message: "Great job on the presentation today!", label: "ham" },
  { message: "What time does the movie start?", label: "ham" },
  { message: "Let me know when you get home safely.", label: "ham" },
  { message: "The kids are asking about the weekend trip.", label: "ham" },
  { message: "Can you send me the report when you get a chance?", label: "ham" },
  { message: "I'll call you back after my meeting ends.", label: "ham" },
  { message: "Thanks for the help yesterday, really appreciated it!", label: "ham" },
  { message: "See you at the gym tomorrow morning!", label: "ham" },
];

// Fashion-MNIST style dataset info (placeholder - generates sample patterns)
const generateFashionSample = (numSamples = 100) => {
  const data = [];
  const labels = ['t-shirt', 'trouser', 'pullover', 'dress', 'coat', 'sandal', 'shirt', 'sneaker', 'bag', 'ankle_boot'];
  
  for (let i = 0; i < numSamples; i++) {
    const label = labels[i % 10];
    const labelIdx = i % 10;
    const features = [];
    
    for (let j = 0; j < 784; j++) {
      const row = Math.floor(j / 28);
      const col = j % 28;
      
      // Different patterns for different items
      let value = 0;
      if (labelIdx < 5) {
        // Upper body items - concentrate pixels in upper half
        value = row < 20 ? Math.random() * 200 + 55 : Math.random() * 50;
      } else if (labelIdx < 7) {
        // Footwear - concentrate pixels in lower portion
        value = row > 10 ? Math.random() * 200 + 55 : Math.random() * 50;
      } else {
        // Accessories - scattered pattern
        value = Math.random() * 255;
      }
      features.push(Math.round(value));
    }
    data.push({ ...Object.fromEntries(features.map((f, idx) => [`pixel_${idx}`, f])), label });
  }
  return data;
};

// Dataset configurations
export const sampleDatasets = [
  {
    id: 'iris',
    name: 'Iris Flowers',
    description: '150 samples, 4 features, 3 classes',
    longDescription: 'Classic machine learning dataset for flower species classification based on sepal and petal measurements.',
    category: 'tabular',
    compatibleTemplates: ['mlp', 'autoencoder'],
    features: 4,
    classes: 3,
    samples: 150,
    icon: '🌸',
    color: '#8b5cf6',
    targetColumn: 'species',
    getData: () => irisData,
    previewColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: '45 samples, text, 3 classes',
    longDescription: 'Product review sentiment classification with positive, negative, and neutral labels.',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 3,
    samples: 45,
    icon: '💬',
    color: '#10b981',
    targetColumn: 'sentiment',
    textColumn: 'text',
    getData: () => sentimentData,
    previewColumns: ['text', 'sentiment'],
  },
  {
    id: 'sms-spam',
    name: 'SMS Spam Detection',
    description: '25 samples, text, 2 classes',
    longDescription: 'Binary classification of SMS messages as spam or legitimate (ham).',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 2,
    samples: 25,
    icon: '📱',
    color: '#f59e0b',
    targetColumn: 'label',
    textColumn: 'message',
    getData: () => smsSpamData,
    previewColumns: ['message', 'label'],
  },
  {
    id: 'time-series',
    name: 'Stock Trends',
    description: '1500 timesteps, 9 features, 3 classes',
    longDescription: 'Time series classification for predicting market trends (up, down, stable).',
    category: 'sequence',
    compatibleTemplates: ['rnn'],
    features: 9,
    classes: 3,
    samples: 1500,
    icon: '📈',
    color: '#22c55e',
    targetColumn: 'trend',
    getData: () => generateTimeSeriesData(150),
    previewColumns: ['feature_1', 'feature_2', 'feature_3', 'trend'],
  },
  {
    id: 'mnist-sample',
    name: 'MNIST Digits',
    description: '100 samples, 28x28 pixels, 10 classes',
    longDescription: 'Handwritten digit recognition sample. Each image is 28x28 grayscale pixels.',
    category: 'image',
    compatibleTemplates: ['cnn', 'mlp', 'resnet-block'],
    features: 784,
    classes: 10,
    samples: 100,
    icon: '🔢',
    color: '#06b6d4',
    targetColumn: 'label',
    getData: () => generateMNISTSample(100),
    previewColumns: ['pixel_0', 'pixel_1', 'pixel_2', '...', 'label'],
    isGenerated: true,
  },
  {
    id: 'fashion-sample',
    name: 'Fashion Items',
    description: '100 samples, 28x28 pixels, 10 classes',
    longDescription: 'Fashion item classification (t-shirt, trouser, dress, etc). Similar to MNIST format.',
    category: 'image',
    compatibleTemplates: ['cnn', 'mlp', 'resnet-block'],
    features: 784,
    classes: 10,
    samples: 100,
    icon: '👕',
    color: '#ec4899',
    targetColumn: 'label',
    getData: () => generateFashionSample(100),
    previewColumns: ['pixel_0', 'pixel_1', 'pixel_2', '...', 'label'],
    isGenerated: true,
  },
  {
    id: 'cifar10-sample',
    name: 'CIFAR-10 Objects',
    description: '100 samples, 32x32 RGB, 10 classes',
    longDescription: 'Color image classification with 10 object categories: airplane, automobile, bird, cat, deer, dog, frog, horse, ship, truck.',
    category: 'image',
    compatibleTemplates: ['cnn', 'resnet-block'],
    features: 3072,
    classes: 10,
    samples: 100,
    icon: '🖼️',
    color: '#6366f1',
    targetColumn: 'label',
    getData: () => generateCIFAR10Sample(100),
    previewColumns: ['pixel_0', 'pixel_1', 'pixel_2', '...', 'label'],
    isGenerated: true,
    imageConfig: {
      height: 32,
      width: 32,
      channels: 3
    }
  },
  {
    id: 'movie-reviews',
    name: 'Movie Reviews',
    description: '100 reviews, text, 3 classes',
    longDescription: 'Large movie review sentiment dataset with positive, negative, and neutral ratings.',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 3,
    samples: 100,
    icon: '🎬',
    color: '#ef4444',
    targetColumn: 'rating',
    textColumn: 'review',
    getData: () => movieReviewsData,
    previewColumns: ['review', 'rating'],
  },
  {
    id: 'news-categories',
    name: 'News Headlines',
    description: '80 headlines, text, 4 classes',
    longDescription: 'News headline classification into Technology, Sports, Business, and Entertainment categories.',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 4,
    samples: 80,
    icon: '📰',
    color: '#0ea5e9',
    targetColumn: 'category',
    textColumn: 'headline',
    getData: () => newsCategoryData,
    previewColumns: ['headline', 'category'],
  },
  {
    id: 'intent-classification',
    name: 'Chatbot Intents',
    description: '60 utterances, text, 6 classes',
    longDescription: 'Intent classification for chatbots: greeting, goodbye, help, order_status, refund, pricing.',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 6,
    samples: 60,
    icon: '🤖',
    color: '#14b8a6',
    targetColumn: 'intent',
    textColumn: 'text',
    getData: () => intentClassificationData,
    previewColumns: ['text', 'intent'],
  },
];

// Get datasets compatible with a template
export const getDatasetsForTemplate = (templateId) => {
  return sampleDatasets.filter(ds => ds.compatibleTemplates.includes(templateId));
};

// Get dataset by ID
export const getDatasetById = (datasetId) => {
  return sampleDatasets.find(ds => ds.id === datasetId);
};

// Convert dataset to CSV string
export const datasetToCSV = (dataset) => {
  const data = dataset.getData();
  if (!data || data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const val = row[col];
      // Escape strings with commas or quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
};

// Download dataset as CSV
export const downloadDatasetCSV = (dataset) => {
  const csvContent = datasetToCSV(dataset);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dataset.id}_dataset.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default sampleDatasets;
