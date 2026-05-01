export const TEAM = [
  'Sayrona','Ruben','Esther','Joris','Mark','Paul','Guido',
  'Suzet','Bart','Michal','Janneke','Anastasia','Koen','Tom',
  'Lucas','Elan','Zander'
]

export const PHOTOS = [
  { id: 'photo1', file: '/photos/DebouwappTeambuilding-18__1_.jpg', label: 'Photo 1' },
  { id: 'photo2', file: '/photos/DebouwappTeambuilding-22.jpg',     label: 'Photo 2' },
  { id: 'photo3', file: '/photos/DebouwappTeambuilding-29.jpg',     label: 'Photo 3' },
  { id: 'photo4', file: '/photos/DebouwappTeambuilding-36.jpg',     label: 'Photo 4' },
  { id: 'photo5', file: '/photos/DebouwappTeambuilding-37.jpg',     label: 'Photo 5' },
  { id: 'photo6', file: '/photos/DebouwappTeambuilding-42.jpg',     label: 'Photo 6' },
  { id: 'photo7', file: '/photos/DebouwappTeambuildingGroep-21.jpg',label: 'Photo 7' },
]

export const AWARDS = [
  {
    id: 'one_more',
    emoji: '🍻',
    name: 'The "One More" Legend',
    description: 'Says "just one more"… never means it',
    buddy_task: 'Together responsible for the evening drinks agenda',
    questions: [
      'Who is most likely to say "I\'m going to bed"… and then stay another 2 hours?',
      'Who suggests "just one more drink" when everyone is already tired?',
      'Who turns a quiet evening into a long night?',
      'Who is hardest to convince to call it a night?',
    ],
  },
  {
    id: 'night_owl',
    emoji: '🌙',
    name: 'The Night Owl',
    description: 'Stays up the latest',
    buddy_task: 'Together responsible for the last one to bed check',
    questions: [
      'Who is still awake when everyone else is already asleep?',
      'Who would still be talking at 3AM like it\'s 9PM?',
      'Who is most likely to go to bed last every single night?',
      'Who would say "sleep is optional"?',
    ],
  },
  {
    id: 'breakfast_boss',
    emoji: '🍳',
    name: 'Breakfast Boss',
    description: 'Takes charge of coffee and breakfast',
    buddy_task: 'Together responsible for breakfast during the trip',
    questions: [
      'Who is most likely to organize breakfast for everyone?',
      'Who makes sure coffee happens no matter what?',
      'Who would take charge in the morning without being asked?',
      'Who is the most functional human before 9AM?',
    ],
  },
  {
    id: 'cleanup',
    emoji: '🧼',
    name: 'The Cleanup Captain',
    description: 'Always ends up cleaning (whether they planned to or not)',
    buddy_task: 'Together responsible for keeping the place tidy',
    questions: [
      'Who is most likely to start cleaning while others are still sitting?',
      'Who can\'t relax if things are messy?',
      'Who quietly fixes the chaos without saying anything?',
      'Who would leave the place cleaner than they found it?',
    ],
  },
]

// Flat list of all questions with award reference
export const ALL_QUESTIONS = AWARDS.flatMap((award, aIdx) =>
  award.questions.map((q, qIdx) => ({
    id: `${award.id}_${qIdx}`,
    awardId: award.id,
    awardIdx: aIdx,
    questionIdx: qIdx,
    text: q,
    emoji: award.emoji,
    awardName: award.name,
  }))
)

export type Phase =
  | 'lobby'
  | 'caption_submit'
  | 'caption_show'
  | 'team_vote'
  | 'team_reveal'
  | 'awards'
  | 'buddy_pick'
  | 'buddy_reveal'
  | 'done'

export interface GameState {
  phase: Phase
  currentPhotoIdx: number   // 0-6 for caption round
  currentQuestionIdx: number // 0-15 for team round
  revealedAnswer: boolean
}
