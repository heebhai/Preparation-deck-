package com.syllabustracker.model

enum class MilestoneType(val label: String) {
    LECTURE("Lecture"),
    NOTES("Notes"),
    PRACTICE("Practice"),
    EXTRA("Extra")
}

enum class SubjectTone {
    MINT, APRICOT, SKY, ROSE, LAVENDER
}

data class ChapterMilestones(
    val lecture: Boolean = false,
    val notes: Boolean = false,
    val practice: Boolean = false,
    val extra: Boolean = false
) {
    val isComplete: Boolean get() = lecture && notes && practice && extra
    val completedCount: Int get() = listOf(lecture, notes, practice, extra).count { it }
}

data class Chapter(
    val id: String,
    val name: String,
    val milestones: ChapterMilestones = ChapterMilestones(),
    val milestoneTimestamps: Map<MilestoneType, Long> = emptyMap()
)

data class SubSubject(
    val id: String,
    val name: String,
    val chapters: List<Chapter>
)

data class Subject(
    val id: String,
    val name: String,
    val tone: SubjectTone,
    val subSubjects: List<SubSubject>
) {
    val totalChapters: Int get() = subSubjects.sumOf { it.chapters.size }
    val completedChapters: Int get() = subSubjects.sumOf { sub -> sub.chapters.count { it.milestones.isComplete } }
}

object DummySyllabusData {
    val subjects = listOf(
        Subject(
            id = "science",
            name = "Science",
            tone = SubjectTone.MINT,
            subSubjects = listOf(
                SubSubject(
                    id = "physics",
                    name = "Physics",
                    chapters = listOf(
                        Chapter("sci-phy-1", "Ch 1: Light – Reflection and Refraction"),
                        Chapter("sci-phy-2", "Ch 2: The Human Eye and the Colourful World"),
                        Chapter("sci-phy-3", "Ch 3: Electricity"),
                        Chapter("sci-phy-4", "Ch 4: Magnetic Effects of Electric Current"),
                        Chapter("sci-phy-5", "Ch 5: Our Environment")
                    )
                ),
                SubSubject(
                    id = "chemistry",
                    name = "Chemistry",
                    chapters = listOf(
                        Chapter("sci-chem-1", "Ch 1: Chemical Reactions and Equations"),
                        Chapter("sci-chem-2", "Ch 2: Acids, Bases and Salts"),
                        Chapter("sci-chem-3", "Ch 3: Metals and Non-metals"),
                        Chapter("sci-chem-4", "Ch 4: Carbon and its Compounds")
                    )
                ),
                SubSubject(
                    id = "biology",
                    name = "Biology",
                    chapters = listOf(
                        Chapter("sci-bio-1", "Ch 1: Life Processes"),
                        Chapter("sci-bio-2", "Ch 2: Control and Coordination"),
                        Chapter("sci-bio-3", "Ch 3: How do Organisms Reproduce?"),
                        Chapter("sci-bio-4", "Ch 4: Heredity")
                    )
                )
            )
        ),
        Subject(
            id = "sst",
            name = "Social Science",
            tone = SubjectTone.APRICOT,
            subSubjects = listOf(
                SubSubject(
                    id = "history",
                    name = "History",
                    chapters = listOf(
                        Chapter("sst-his-1", "Ch 1: The Rise of Nationalism in Europe"),
                        Chapter("sst-his-2", "Ch 2: Nationalism in India"),
                        Chapter("sst-his-3", "Ch 3: The Making of a Global World"),
                        Chapter("sst-his-4", "Ch 4: Print Culture and the Modern World"),
                        Chapter("sst-his-5", "Ch 5: The Age of Industrialisation")
                    )
                ),
                SubSubject(
                    id = "geography",
                    name = "Geography",
                    chapters = listOf(
                        Chapter("sst-geo-1", "Ch 1: Resources and Development"),
                        Chapter("sst-geo-2", "Ch 2: Forest and Wildlife Resources"),
                        Chapter("sst-geo-3", "Ch 3: Water Resources"),
                        Chapter("sst-geo-4", "Ch 4: Agriculture"),
                        Chapter("sst-geo-5", "Ch 5: Minerals and Energy Resources"),
                        Chapter("sst-geo-6", "Ch 6: Manufacturing Industries"),
                        Chapter("sst-geo-7", "Ch 7: Lifelines of National Economy")
                    )
                ),
                SubSubject(
                    id = "civics",
                    name = "Political Science (Civics)",
                    chapters = listOf(
                        Chapter("sst-civ-1", "Ch 1: Power-sharing"),
                        Chapter("sst-civ-2", "Ch 2: Federalism"),
                        Chapter("sst-civ-3", "Ch 3: Gender, Religion and Caste"),
                        Chapter("sst-civ-4", "Ch 4: Political Parties"),
                        Chapter("sst-civ-5", "Ch 5: Outcomes of Democracy")
                    )
                ),
                SubSubject(
                    id = "economics",
                    name = "Economics",
                    chapters = listOf(
                        Chapter("sst-eco-1", "Ch 1: Development"),
                        Chapter("sst-eco-2", "Ch 2: Sectors of the Indian Economy"),
                        Chapter("sst-eco-3", "Ch 3: Money and Credit"),
                        Chapter("sst-eco-4", "Ch 4: Globalisation and the Indian Economy"),
                        Chapter("sst-eco-5", "Ch 5: Consumer Rights")
                    )
                )
            )
        ),
        Subject(
            id = "maths",
            name = "Mathematics",
            tone = SubjectTone.SKY,
            subSubjects = listOf(
                SubSubject(
                    id = "maths-core",
                    name = "Maths",
                    chapters = listOf(
                        Chapter("math-1", "Ch 1: Real Numbers"),
                        Chapter("math-2", "Ch 2: Polynomials"),
                        Chapter("math-3", "Ch 3: Pair of Linear Equations in Two Variables"),
                        Chapter("math-4", "Ch 4: Quadratic Equations"),
                        Chapter("math-5", "Ch 5: Arithmetic Progressions"),
                        Chapter("math-6", "Ch 6: Triangles"),
                        Chapter("math-7", "Ch 7: Coordinate Geometry"),
                        Chapter("math-8", "Ch 8: Introduction to Trigonometry"),
                        Chapter("math-9", "Ch 9: Some Applications of Trigonometry"),
                        Chapter("math-10", "Ch 10: Circles"),
                        Chapter("math-11", "Ch 11: Areas Related to Circles"),
                        Chapter("math-12", "Ch 12: Surface Areas and Volumes"),
                        Chapter("math-13", "Ch 13: Statistics"),
                        Chapter("math-14", "Ch 14: Probability")
                    )
                )
            )
        ),
        Subject(
            id = "english",
            name = "English",
            tone = SubjectTone.ROSE,
            subSubjects = listOf(
                SubSubject(
                    id = "first-flight",
                    name = "First Flight",
                    chapters = listOf(
                        Chapter("eng-ff-1", "A Letter to God"),
                        Chapter("eng-ff-2", "Nelson Mandela: Long Walk to Freedom"),
                        Chapter("eng-ff-3", "Two Stories about Flying"),
                        Chapter("eng-ff-4", "From the Diary of Anne Frank"),
                        Chapter("eng-ff-5", "Glimpses of India"),
                        Chapter("eng-ff-6", "Mijbil the Otter"),
                        Chapter("eng-ff-7", "Madam Rides the Bus"),
                        Chapter("eng-ff-8", "The Sermon at Benares"),
                        Chapter("eng-ff-9", "The Proposal"),
                        Chapter("eng-ff-p1", "Dust of Snow (Poem)"),
                        Chapter("eng-ff-p2", "Fire and Ice (Poem)"),
                        Chapter("eng-ff-p3", "A Tiger in the Zoo (Poem)"),
                        Chapter("eng-ff-p4", "How to Tell Wild Animals (Poem)"),
                        Chapter("eng-ff-p5", "The Ball Poem (Poem)"),
                        Chapter("eng-ff-p6", "Amanda! (Poem)"),
                        Chapter("eng-ff-p7", "The Trees (Poem)"),
                        Chapter("eng-ff-p8", "Fog (Poem)"),
                        Chapter("eng-ff-p9", "The Tale of Custard the Dragon (Poem)"),
                        Chapter("eng-ff-p10", "For Anne Gregory (Poem)")
                    )
                ),
                SubSubject(
                    id = "footprints-without-feet",
                    name = "Footprints Without Feet",
                    chapters = listOf(
                        Chapter("eng-fwf-1", "A Triumph of Surgery"),
                        Chapter("eng-fwf-2", "The Thief's Story"),
                        Chapter("eng-fwf-3", "The Midnight Visitor"),
                        Chapter("eng-fwf-4", "A Question of Trust"),
                        Chapter("eng-fwf-5", "Footprints without Feet"),
                        Chapter("eng-fwf-6", "The Making of a Scientist"),
                        Chapter("eng-fwf-7", "The Necklace"),
                        Chapter("eng-fwf-8", "Bholi"),
                        Chapter("eng-fwf-9", "The Book That Saved the Earth")
                    )
                )
            )
        ),
        Subject(
            id = "hindi",
            name = "Hindi",
            tone = SubjectTone.LAVENDER,
            subSubjects = listOf(
                SubSubject(
                    id = "kshitiz",
                    name = "Kshitiz",
                    chapters = listOf(
                        Chapter("hin-ks-1", "Ch 1: Surdas ke Pad (Kavya Khand)"),
                        Chapter("hin-ks-2", "Ch 2: Ram-Lakshman-Parashuram Samvad (Kavya Khand)"),
                        Chapter("hin-ks-3", "Ch 3: Dev – Savaiya aur Kabitt (Kavya Khand)"),
                        Chapter("hin-ks-4", "Ch 4: Atmakathya – Jaishankar Prasad (Kavya Khand)"),
                        Chapter("hin-ks-5", "Ch 5: Utsah aur At Nahi Rahi Hai (Kavya Khand)"),
                        Chapter("hin-ks-6", "Ch 6: Yeh Danturit Muskan aur Fasal (Kavya Khand)"),
                        Chapter("hin-ks-7", "Ch 7: Chhaya Mat Chhuna (Kavya Khand)"),
                        Chapter("hin-ks-8", "Ch 8: Kanyadan (Kavya Khand)"),
                        Chapter("hin-ks-9", "Ch 9: Sangatkar (Kavya Khand)"),
                        Chapter("hin-ks-10", "Ch 10: Netaji ka Chashma (Gadya Khand)"),
                        Chapter("hin-ks-11", "Ch 11: Balgobin Bhagat (Gadya Khand)"),
                        Chapter("hin-ks-12", "Ch 12: Lakhnavi Andaz (Gadya Khand)"),
                        Chapter("hin-ks-13", "Ch 13: Manviya Karuna ki Divya Chamak (Gadya Khand)"),
                        Chapter("hin-ks-14", "Ch 14: Ek Kahani Yeh Bhi (Gadya Khand)"),
                        Chapter("hin-ks-15", "Ch 15: Stri Shiksha ke Virodhi Kutarkon ka Khandan (Gadya Khand)"),
                        Chapter("hin-ks-16", "Ch 16: Naubatkhane mein Ibadat (Gadya Khand)"),
                        Chapter("hin-ks-17", "Ch 17: Sanskriti (Gadya Khand)")
                    )
                ),
                SubSubject(
                    id = "kritika",
                    name = "Kritika",
                    chapters = listOf(
                        Chapter("hin-kr-1", "Ch 1: Mata ka Aanchal"),
                        Chapter("hin-kr-2", "Ch 2: George Pancham ki Naak"),
                        Chapter("hin-kr-3", "Ch 3: Sana Sana Hath Jodi"),
                        Chapter("hin-kr-4", "Ch 4: Ek Kahani Yeh Bhi"),
                        Chapter("hin-kr-5", "Ch 5: Main Kyun Likhata Hoon")
                    )
                )
            )
        )
    )
}
