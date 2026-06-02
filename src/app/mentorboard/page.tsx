import { auth } from "@/auth";
import { cultures, cohortsByMajor, cohortsByGradYear, topMentors } from "@/lib/queries/mentorboard";
import { MentorboardView } from "@/components/mentorboard/MentorboardView";

// Public board (counts only). 3 tabs: mentorship cultures, who-gives-back cohorts, top mentors.
export default async function MentorboardPage() {
  const [session, cultureRows, byMajor, byYear, mentors] = await Promise.all([
    auth(),
    cultures("all"),
    cohortsByMajor(),
    cohortsByGradYear(),
    topMentors(20),
  ]);
  return (
    <MentorboardView
      cultures={cultureRows}
      cohortsMajor={byMajor}
      cohortsYear={byYear}
      mentors={mentors}
      currentUsername={session?.user?.username ?? null}
    />
  );
}
