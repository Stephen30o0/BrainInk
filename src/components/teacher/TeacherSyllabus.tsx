import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    Edit3,
    Eye,
    FileText,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    Upload,
    Users,
    WandSparkles
} from 'lucide-react';
import {
    syllabusService,
    type CreateLessonPlanRequest,
    type CreateSyllabusRequest,
    type Syllabus,
    type TeacherClassroom,
    type TeacherLessonPlan,
    type TeacherSubject
} from '../../services/syllabusService';

const parseLines = (value: string): string[] =>
    value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

const validateLessonForm = (form: {
    classroom_id: string;
    title: string;
    description: string;
    duration_minutes: number;
    mode: 'manual' | 'ai';
    source_file: File | null;
}): string | null => {
    const title = form.title.trim();
    const description = form.description.trim();

    if (!form.classroom_id) {
        return 'Please select a classroom.';
    }
    if (title.length < 3) {
        return 'Title must be at least 3 characters.';
    }
    if (description.length < 10) {
        return 'Description must be at least 10 characters.';
    }
    if (form.duration_minutes < 10 || form.duration_minutes > 240) {
        return 'Duration must be between 10 and 240 minutes.';
    }
    if (form.mode === 'ai' && form.source_file && form.source_file.type !== 'application/pdf') {
        return 'Source file must be a PDF.';
    }
    if (form.mode === 'ai' && form.source_file && form.source_file.size > 15 * 1024 * 1024) {
        return 'Source PDF must be 15MB or smaller.';
    }

    return null;
};

export const TeacherSyllabus: React.FC = () => {
    const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
    const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
    const [classrooms, setClassrooms] = useState<TeacherClassroom[]>([]);

    const [subjectSyllabuses, setSubjectSyllabuses] = useState<Syllabus[]>([]);
    const [lessonPlans, setLessonPlans] = useState<TeacherLessonPlan[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'subjects' | 'subject' | 'lesson-plan'>('subjects');
    const [selectedSubject, setSelectedSubject] = useState<TeacherSubject | null>(null);
    const [selectedLessonPlan, setSelectedLessonPlan] = useState<TeacherLessonPlan | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [lessonPlanSearch, setLessonPlanSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [showCreateSyllabusModal, setShowCreateSyllabusModal] = useState(false);
    const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
    const [showEditLessonModal, setShowEditLessonModal] = useState(false);
    const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        subject_id: '',
        term_length_weeks: 12,
        textbook_file: null as File | null
    });

    const [lessonForm, setLessonForm] = useState({
        mode: 'manual' as 'manual' | 'ai',
        classroom_id: '',
        title: '',
        description: '',
        duration_minutes: 45,
        learning_objectives_text: '',
        activities_text: '',
        materials_needed_text: '',
        assessment_strategy: '',
        homework: '',
        source_file: null as File | null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [teacherSubjects, allSyllabuses, teacherClassrooms] = await Promise.all([
                syllabusService.getTeacherSubjects(),
                syllabusService.getAllSyllabuses(),
                syllabusService.getTeacherClassrooms()
            ]);

            setSubjects(teacherSubjects);
            setSyllabuses(allSyllabuses);
            setClassrooms(Array.isArray(teacherClassrooms) ? teacherClassrooms : []);
        } catch (loadError) {
            console.error('Error loading syllabus data:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'Failed to load data');
            setSubjects([]);
            setSyllabuses([]);
            setClassrooms([]);
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectSyllabuses = async (subject: TeacherSubject) => {
        try {
            setLoading(true);
            setError(null);

            const [detailedSyllabuses, lessonDashboard] = await Promise.all([
                syllabusService.getSubjectSyllabusesWithPlans(subject.id),
                syllabusService.getLessonDashboard({
                    subjectId: subject.id,
                    activeOnly: true,
                    limit: 200
                })
            ]);

            setSelectedSubject(subject);
            setSubjectSyllabuses(detailedSyllabuses);
            setLessonPlans(lessonDashboard.lessons || []);
            setSelectedLessonPlan(null);
            setSearchTerm('');
            setLessonPlanSearch('');
            setFilterStatus('all');
            setView('subject');
        } catch (loadError) {
            console.error('Error loading subject data:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'Failed to load subject data');
        } finally {
            setLoading(false);
        }
    };

    const openLessonPlan = async (lessonId: number) => {
        try {
            setLoading(true);
            const lesson = await syllabusService.getLessonPlan(lessonId);
            setSelectedLessonPlan(lesson);
            setView('lesson-plan');
        } catch (loadError) {
            console.error('Error loading lesson plan:', loadError);
            alert(loadError instanceof Error ? loadError.message : 'Failed to load lesson plan');
        } finally {
            setLoading(false);
        }
    };

    const goBackToSubjects = () => {
        setView('subjects');
        setSelectedSubject(null);
        setSelectedLessonPlan(null);
        setSubjectSyllabuses([]);
        setLessonPlans([]);
        setSearchTerm('');
        setLessonPlanSearch('');
        setFilterStatus('all');
    };

    const goBackToSubjectOverview = () => {
        setView('subject');
        setSelectedLessonPlan(null);
    };

    const handleCreateSyllabus = async () => {
        try {
            if (!createForm.title || !createForm.subject_id) {
                alert('Please fill in title and select a subject');
                return;
            }

            const payload: CreateSyllabusRequest = {
                title: createForm.title,
                description: createForm.description,
                subject_id: Number(createForm.subject_id),
                term_length_weeks: createForm.term_length_weeks,
                textbook_file: createForm.textbook_file ?? undefined
            };

            const newSyllabus = await syllabusService.createSyllabus(payload);

            setSyllabuses((prev) => [newSyllabus, ...prev]);
            if (selectedSubject && newSyllabus.subject_id === selectedSubject.id) {
                setSubjectSyllabuses((prev) => [newSyllabus, ...prev]);
            }

            setShowCreateSyllabusModal(false);
            setCreateForm({
                title: '',
                description: '',
                subject_id: selectedSubject?.id.toString() || '',
                term_length_weeks: 12,
                textbook_file: null
            });
            alert('Syllabus created successfully!');
        } catch (createError) {
            console.error('Error creating syllabus:', createError);
            alert(createError instanceof Error ? createError.message : 'Failed to create syllabus');
        }
    };

    const handleCreateLessonPlan = async () => {
        try {
            if (!selectedSubject) {
                alert('Select a subject first.');
                return;
            }
            const validationError = validateLessonForm(lessonForm);
            if (validationError) {
                alert(validationError);
                return;
            }

            const title = lessonForm.title.trim();
            const description = lessonForm.description.trim();

            let created: TeacherLessonPlan;
            if (lessonForm.mode === 'ai') {
                created = await syllabusService.generateLessonPlan({
                    classroom_id: Number(lessonForm.classroom_id),
                    subject_id: selectedSubject.id,
                    title,
                    description,
                    duration_minutes: lessonForm.duration_minutes,
                    learning_objectives: parseLines(lessonForm.learning_objectives_text),
                    source_file: lessonForm.source_file || undefined
                });
            } else {
                const payload: CreateLessonPlanRequest = {
                    classroom_id: Number(lessonForm.classroom_id),
                    subject_id: selectedSubject.id,
                    title,
                    description,
                    duration_minutes: lessonForm.duration_minutes,
                    learning_objectives: parseLines(lessonForm.learning_objectives_text),
                    activities: parseLines(lessonForm.activities_text),
                    materials_needed: parseLines(lessonForm.materials_needed_text),
                    assessment_strategy: lessonForm.assessment_strategy.trim() || undefined,
                    homework: lessonForm.homework.trim() || undefined,
                    references: []
                };
                created = await syllabusService.createLessonPlan(payload);
            }

            setLessonPlans((prev) => [created, ...prev]);
            setShowCreateLessonModal(false);
            setLessonForm({
                mode: 'manual',
                classroom_id: '',
                title: '',
                description: '',
                duration_minutes: 45,
                learning_objectives_text: '',
                activities_text: '',
                materials_needed_text: '',
                assessment_strategy: '',
                homework: '',
                source_file: null
            });
            alert('Lesson plan created successfully!');
        } catch (createError) {
            console.error('Error creating lesson plan:', createError);
            alert(createError instanceof Error ? createError.message : 'Failed to create lesson plan');
        }
    };

    const handleDeleteLessonPlan = async (lessonId: number) => {
        if (!confirm('Deactivate this lesson plan?')) {
            return;
        }

        try {
            await syllabusService.deleteLessonPlan(lessonId);
            setLessonPlans((prev) => prev.filter((lesson) => lesson.id !== lessonId));
            if (selectedLessonPlan?.id === lessonId) {
                setSelectedLessonPlan(null);
                setView('subject');
            }
            alert('Lesson plan removed from active list.');
        } catch (deleteError) {
            console.error('Error deleting lesson plan:', deleteError);
            alert(deleteError instanceof Error ? deleteError.message : 'Failed to deactivate lesson plan');
        }
    };

    const openEditLessonModal = (lesson: TeacherLessonPlan) => {
        setEditingLessonId(lesson.id);
        setLessonForm({
            mode: 'manual',
            classroom_id: String(lesson.classroom_id),
            title: lesson.title || '',
            description: lesson.description || '',
            duration_minutes: lesson.duration_minutes || 45,
            learning_objectives_text: (lesson.learning_objectives || []).join('\n'),
            activities_text: (lesson.activities || []).join('\n'),
            materials_needed_text: (lesson.materials_needed || []).join('\n'),
            assessment_strategy: lesson.assessment_strategy || '',
            homework: lesson.homework || '',
            source_file: null
        });
        setShowEditLessonModal(true);
    };

    const handleUpdateLessonPlan = async () => {
        try {
            if (!editingLessonId) {
                return;
            }

            const validationError = validateLessonForm(lessonForm);
            if (validationError) {
                alert(validationError);
                return;
            }

            const updates = {
                classroom_id: Number(lessonForm.classroom_id),
                subject_id: selectedSubject?.id,
                title: lessonForm.title.trim(),
                description: lessonForm.description.trim(),
                duration_minutes: lessonForm.duration_minutes,
                learning_objectives: parseLines(lessonForm.learning_objectives_text),
                activities: parseLines(lessonForm.activities_text),
                materials_needed: parseLines(lessonForm.materials_needed_text),
                assessment_strategy: lessonForm.assessment_strategy.trim() || undefined,
                homework: lessonForm.homework.trim() || undefined
            };

            const updated = await syllabusService.updateLessonPlan(editingLessonId, updates);

            setLessonPlans((prev) => prev.map((lesson) => (lesson.id === editingLessonId ? updated : lesson)));
            if (selectedLessonPlan?.id === editingLessonId) {
                setSelectedLessonPlan(updated);
            }

            setShowEditLessonModal(false);
            setEditingLessonId(null);
            alert('Lesson plan updated successfully!');
        } catch (updateError) {
            console.error('Error updating lesson plan:', updateError);
            alert(updateError instanceof Error ? updateError.message : 'Failed to update lesson plan');
        }
    };

    const handleDeleteSyllabus = async (syllabusId: number) => {
        if (!confirm('Are you sure you want to delete this syllabus?')) {
            return;
        }

        try {
            await syllabusService.deleteSyllabus(syllabusId);
            setSyllabuses((prev) => prev.filter((syllabus) => syllabus.id !== syllabusId));
            setSubjectSyllabuses((prev) => prev.filter((syllabus) => syllabus.id !== syllabusId));
            alert('Syllabus deleted successfully!');
        } catch (deleteError) {
            console.error('Error deleting syllabus:', deleteError);
            alert(deleteError instanceof Error ? deleteError.message : 'Failed to delete syllabus');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case 'draft':
                return 'bg-amber-100 text-amber-700 border border-amber-200';
            case 'completed':
                return 'bg-sky-100 text-sky-700 border border-sky-200';
            case 'archived':
                return 'bg-slate-100 text-slate-700 border border-slate-200';
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const getProcessingStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case 'processing':
                return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border border-amber-200';
            case 'failed':
                return 'bg-rose-100 text-rose-700 border border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const filteredSubjects = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return subjects.filter((subject) =>
            subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query)
        );
    }, [subjects, searchTerm]);

    const filteredSubjectSyllabuses = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return subjectSyllabuses.filter((syllabus) => {
            const matchesSearch =
                syllabus.title.toLowerCase().includes(query) ||
                (syllabus.subject_name || '').toLowerCase().includes(query);
            const matchesStatus = filterStatus === 'all' || syllabus.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [subjectSyllabuses, searchTerm, filterStatus]);

    const filteredLessonPlans = useMemo(() => {
        const query = lessonPlanSearch.toLowerCase().trim();
        if (!query) return lessonPlans;

        return lessonPlans.filter((lesson) => {
            const objectives = (lesson.learning_objectives || []).join(' ').toLowerCase();
            return (
                lesson.title.toLowerCase().includes(query) ||
                lesson.description.toLowerCase().includes(query) ||
                (lesson.classroom_name || '').toLowerCase().includes(query) ||
                objectives.includes(query)
            );
        });
    }, [lessonPlans, lessonPlanSearch]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Loading syllabus and lesson data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
                    <div className="flex items-start">
                        <AlertCircle className="w-6 h-6 text-rose-600 mr-3 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-medium text-rose-900">Error Loading Data</h3>
                            <p className="text-rose-700 mt-1">{error}</p>
                            <button
                                onClick={loadData}
                                className="mt-3 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                    {view === 'subject' && (
                        <button
                            onClick={goBackToSubjects}
                            className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                        >
                            Back to Subjects
                        </button>
                    )}
                    {view === 'lesson-plan' && (
                        <button
                            onClick={goBackToSubjectOverview}
                            className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                        >
                            Back to Subject
                        </button>
                    )}

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            {view === 'subjects' && 'My Subjects'}
                            {view === 'subject' && `${selectedSubject?.name} Learning Hub`}
                            {view === 'lesson-plan' && selectedLessonPlan?.title}
                        </h1>
                        <p className="text-slate-600 mt-1">
                            {view === 'subjects' && 'Select a subject to manage lesson plans and syllabuses'}
                            {view === 'subject' && 'Lesson plans are connected to /lessons endpoints and shown above syllabuses'}
                            {view === 'lesson-plan' && 'Detailed lesson plan content from the lesson endpoint'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    {view === 'subject' && (
                        <>
                            <button
                                onClick={() => setShowCreateLessonModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <WandSparkles className="w-4 h-4 mr-2" />
                                Create Lesson Plan
                            </button>
                            <button
                                onClick={() => {
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        subject_id: selectedSubject?.id.toString() || ''
                                    }));
                                    setShowCreateSyllabusModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Syllabus
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={view === 'subjects' ? 'My Subjects' : 'Subject Syllabuses'} value={view === 'subjects' ? subjects.length : subjectSyllabuses.length} icon={BookOpen} tone="blue" />
                <StatCard label={view === 'subject' ? 'Lesson Plans' : 'Active Syllabuses'} value={view === 'subject' ? lessonPlans.length : syllabuses.filter((s) => s.status === 'active').length} icon={Sparkles} tone="emerald" />
                <StatCard label="AI Lessons" value={lessonPlans.filter((l) => l.generated_by_ai).length} icon={WandSparkles} tone="amber" />
                <StatCard label="Total Syllabuses" value={syllabuses.length} icon={FileText} tone="slate" />
            </div>

            {view === 'subjects' && (
                <SubjectsView subjects={filteredSubjects} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSubjectSelect={loadSubjectSyllabuses} />
            )}

            {view === 'subject' && (
                <div className="space-y-6">
                    <LessonPlansSection
                        lessons={filteredLessonPlans}
                        search={lessonPlanSearch}
                        setSearch={setLessonPlanSearch}
                        onOpenPlan={(lesson) => openLessonPlan(lesson.id)}
                        onEditLesson={openEditLessonModal}
                        onCreateNew={() => setShowCreateLessonModal(true)}
                        onDeleteLesson={handleDeleteLessonPlan}
                    />

                    <SyllabusesSection
                        syllabuses={filteredSubjectSyllabuses}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        getStatusColor={getStatusColor}
                        getProcessingStatusColor={getProcessingStatusColor}
                        onSyllabusDetails={(syllabus) => {
                            setSelectedSyllabus(syllabus);
                            setShowDetailsModal(true);
                        }}
                        onSyllabusDelete={handleDeleteSyllabus}
                        onCreateNew={() => setShowCreateSyllabusModal(true)}
                    />
                </div>
            )}

            {view === 'lesson-plan' && selectedLessonPlan && (
                <LessonPlanContentView
                    lesson={selectedLessonPlan}
                    allLessons={lessonPlans}
                    onBack={goBackToSubjectOverview}
                    onOpenPlan={(lesson) => openLessonPlan(lesson.id)}
                    onEditLesson={openEditLessonModal}
                    onDeleteLesson={handleDeleteLessonPlan}
                />
            )}

            {showCreateLessonModal && (
                <CreateLessonPlanModal
                    form={lessonForm}
                    classrooms={classrooms}
                    onClose={() => setShowCreateLessonModal(false)}
                    onSubmit={handleCreateLessonPlan}
                    setForm={setLessonForm}
                />
            )}

            {showEditLessonModal && (
                <EditLessonPlanModal
                    form={lessonForm}
                    classrooms={classrooms}
                    onClose={() => {
                        setShowEditLessonModal(false);
                        setEditingLessonId(null);
                    }}
                    onSubmit={handleUpdateLessonPlan}
                    setForm={setLessonForm}
                />
            )}

            {showCreateSyllabusModal && (
                <CreateSyllabusModal
                    subjects={subjects}
                    form={createForm}
                    setForm={setCreateForm}
                    onClose={() => setShowCreateSyllabusModal(false)}
                    onSubmit={handleCreateSyllabus}
                />
            )}

            {showDetailsModal && selectedSyllabus && (
                <SyllabusDetailsModal
                    syllabus={selectedSyllabus}
                    getStatusColor={getStatusColor}
                    getProcessingStatusColor={getProcessingStatusColor}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: 'blue' | 'emerald' | 'amber' | 'slate'; }> = ({ label, value, icon: Icon, tone }) => {
    const tones: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-700'
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

const SubjectsView: React.FC<{ subjects: TeacherSubject[]; searchTerm: string; setSearchTerm: (term: string) => void; onSubjectSelect: (subject: TeacherSubject) => void; }> = ({ subjects, searchTerm, setSearchTerm, onSubjectSelect }) => (
    <>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjects.map((subject) => (
                <button key={subject.id} onClick={() => onSubjectSelect(subject)} className="text-left bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                                <p className="text-sm text-slate-500">{subject.code}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </div>
                    {!!subject.description && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{subject.description}</p>}
                    <div className="inline-flex items-center text-sm text-slate-600">
                        <Users className="w-4 h-4 mr-1" />
                        {subject.student_count} students
                    </div>
                </button>
            ))}
        </div>
    </>
);

const LessonPlansSection: React.FC<{
    lessons: TeacherLessonPlan[];
    search: string;
    setSearch: (value: string) => void;
    onOpenPlan: (lesson: TeacherLessonPlan) => void;
    onEditLesson: (lesson: TeacherLessonPlan) => void;
    onCreateNew: () => void;
    onDeleteLesson: (lessonId: number) => void;
}> = ({ lessons, search, setSearch, onOpenPlan, onEditLesson, onCreateNew, onDeleteLesson }) => (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-xl font-semibold">Lesson Plans</h2>
                    <p className="text-slate-200 text-sm mt-1">Connected to `/study-area/lessons/dashboard` and `/study-area/lessons/{'{id}'}`.</p>
                </div>
                <button onClick={onCreateNew} className="inline-flex items-center px-3 py-2 rounded-lg bg-white/15 border border-white/20 hover:bg-white/25 text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Lesson Plan
                </button>
            </div>
        </div>

        <div className="p-6 space-y-5">
            <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search lesson plans"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
            </div>

            {lessons.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {lessons.map((lesson) => (
                        <article key={lesson.id} className="text-left rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-md transition-all bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                    {lesson.duration_minutes} min
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onOpenPlan(lesson)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" title="View lesson">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onEditLesson(lesson)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit lesson">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDeleteLesson(lesson.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" title="Deactivate lesson">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-slate-900 line-clamp-1">{lesson.title}</h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{lesson.description}</p>
                            <div className="mt-3 text-xs text-slate-500">
                                <p className="line-clamp-1">Classroom: {lesson.classroom_name || lesson.classroom_id}</p>
                                <p className="line-clamp-1 mt-1">Updated: {new Date(lesson.updated_date).toLocaleDateString()}</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                    <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900">No lesson plans yet</h3>
                    <p className="text-slate-600 mt-2 mb-5">Create your first lesson plan for this subject.</p>
                    <button onClick={onCreateNew} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Lesson Plan
                    </button>
                </div>
            )}
        </div>
    </section>
);

const SyllabusesSection: React.FC<{
    syllabuses: Syllabus[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    getStatusColor: (status: string) => string;
    getProcessingStatusColor: (status: string) => string;
    onSyllabusDetails: (syllabus: Syllabus) => void;
    onSyllabusDelete: (syllabusId: number) => void;
    onCreateNew: () => void;
}> = ({ syllabuses, searchTerm, setSearchTerm, filterStatus, setFilterStatus, getStatusColor, getProcessingStatusColor, onSyllabusDetails, onSyllabusDelete, onCreateNew }) => (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Syllabuses</h2>
            <p className="text-slate-600 text-sm mt-1">Supporting curriculum documents for this subject.</p>
        </div>
        <div className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search syllabuses..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {syllabuses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {syllabuses.map((syllabus) => (
                        <article key={syllabus.id} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900">{syllabus.title}</h3>
                                    {!!syllabus.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{syllabus.description}</p>}
                                </div>
                                <button onClick={() => onSyllabusDetails(syllabus)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="View details">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${getStatusColor(syllabus.status)}`}>{syllabus.status}</span>
                                <span className={`px-2 py-1 rounded-full ${getProcessingStatusColor(syllabus.ai_processing_status)}`}>
                                    AI: {syllabus.ai_processing_status}
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                                <button onClick={() => onSyllabusDelete(syllabus.id)} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg text-rose-700 hover:bg-rose-50">
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                    <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900">No syllabuses found</h3>
                    <button onClick={onCreateNew} className="mt-4 inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Syllabus
                    </button>
                </div>
            )}
        </div>
    </section>
);

const LessonPlanContentView: React.FC<{
    lesson: TeacherLessonPlan;
    allLessons: TeacherLessonPlan[];
    onBack: () => void;
    onOpenPlan: (lesson: TeacherLessonPlan) => void;
    onEditLesson: (lesson: TeacherLessonPlan) => void;
    onDeleteLesson: (lessonId: number) => void;
}> = ({ lesson, allLessons, onBack, onOpenPlan, onEditLesson, onDeleteLesson }) => {
    const siblingLessons = allLessons.filter((item) => item.subject_id === lesson.subject_id);

    return (
        <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <p className="text-sm text-slate-500">{lesson.subject_name || 'Lesson Plan'}</p>
                        <h2 className="text-2xl font-bold text-slate-900 mt-1">{lesson.title}</h2>
                        <p className="text-slate-600 mt-2">{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">{lesson.duration_minutes} min</span>
                        {lesson.generated_by_ai && <span className="px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-700 border border-violet-200">AI Generated</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ContentListCard title="Learning Objectives" items={lesson.learning_objectives || []} emptyLabel="No objectives listed" />
                <ContentListCard title="Activities" items={lesson.activities || []} emptyLabel="No activities listed" />
                <ContentListCard title="Materials Needed" items={lesson.materials_needed || []} emptyLabel="No materials listed" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Assessment and Homework</h3>
                    <p className="text-sm text-slate-700 mt-3"><span className="font-medium">Assessment:</span> {lesson.assessment_strategy || 'Not specified'}</p>
                    <p className="text-sm text-slate-700 mt-2"><span className="font-medium">Homework:</span> {lesson.homework || 'Not specified'}</p>

                    <h4 className="font-medium text-slate-900 mt-6">References</h4>
                    {(lesson.references || []).length > 0 ? (
                        <ul className="mt-2 space-y-2">
                            {lesson.references.map((reference, index) => (
                                <li key={index} className="text-sm text-slate-700 rounded-lg border border-slate-200 px-3 py-2">
                                    <p className="font-medium">{reference.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">{reference.url}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 mt-2">No references listed.</p>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Other Lessons</h3>
                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                        {siblingLessons.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onOpenPlan(item)}
                                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${item.id === lesson.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                <p className={`text-xs mt-1 ${item.id === lesson.id ? 'text-slate-200' : 'text-slate-500'}`}>{item.duration_minutes} min</p>
                            </button>
                        ))}
                    </div>

                    <button onClick={() => onDeleteLesson(lesson.id)} className="mt-4 w-full px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50">
                        Deactivate Lesson Plan
                    </button>
                    <button onClick={() => onEditLesson(lesson)} className="mt-2 w-full px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50">
                        Edit Lesson Plan
                    </button>
                    <button onClick={onBack} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100">
                        Back to Lesson Plans
                    </button>
                </div>
            </div>
        </section>
    );
};

const ContentListCard: React.FC<{ title: string; items: string[]; emptyLabel: string }> = ({ title, items, emptyLabel }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {items.length > 0 ? (
            <ul className="mt-3 space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{item}</li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-slate-500 mt-3">{emptyLabel}</p>
        )}
    </div>
);

const CreateLessonPlanModal: React.FC<{
    form: {
        mode: 'manual' | 'ai';
        classroom_id: string;
        title: string;
        description: string;
        duration_minutes: number;
        learning_objectives_text: string;
        activities_text: string;
        materials_needed_text: string;
        assessment_strategy: string;
        homework: string;
        source_file: File | null;
    };
    classrooms: TeacherClassroom[];
    onClose: () => void;
    onSubmit: () => void;
    setForm: React.Dispatch<React.SetStateAction<{
        mode: 'manual' | 'ai';
        classroom_id: string;
        title: string;
        description: string;
        duration_minutes: number;
        learning_objectives_text: string;
        activities_text: string;
        materials_needed_text: string;
        assessment_strategy: string;
        homework: string;
        source_file: File | null;
    }>>;
}> = ({ form, classrooms, onClose, onSubmit, setForm }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Create Lesson Plan</h2>
                <p className="text-slate-600 mt-1">Connected directly to lesson endpoints.</p>
            </div>

            <div className="p-6 space-y-5">
                <div className="flex gap-2">
                    <button onClick={() => setForm((prev) => ({ ...prev, mode: 'manual' }))} className={`px-3 py-2 rounded-lg text-sm border ${form.mode === 'manual' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-700'}`}>Manual</button>
                    <button onClick={() => setForm((prev) => ({ ...prev, mode: 'ai' }))} className={`px-3 py-2 rounded-lg text-sm border ${form.mode === 'ai' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}>AI Generate</button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Classroom *</label>
                    <select value={form.classroom_id} onChange={(event) => setForm((prev) => ({ ...prev, classroom_id: event.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                        <option value="">Select classroom</option>
                        {classrooms.map((classroom) => (
                            <option key={classroom.id} value={String(classroom.id)}>{classroom.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                    <input type="text" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                    <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                    <input type="number" min="10" max="240" value={form.duration_minutes} onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: parseInt(event.target.value, 10) || 45 }))} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Learning Objectives (one per line)</label>
                    <textarea value={form.learning_objectives_text} onChange={(event) => setForm((prev) => ({ ...prev, learning_objectives_text: event.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                {form.mode === 'manual' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Activities (one per line)</label>
                            <textarea value={form.activities_text} onChange={(event) => setForm((prev) => ({ ...prev, activities_text: event.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Materials Needed (one per line)</label>
                            <textarea value={form.materials_needed_text} onChange={(event) => setForm((prev) => ({ ...prev, materials_needed_text: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Strategy</label>
                            <textarea value={form.assessment_strategy} onChange={(event) => setForm((prev) => ({ ...prev, assessment_strategy: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Homework</label>
                            <textarea value={form.homework} onChange={(event) => setForm((prev) => ({ ...prev, homework: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                        </div>
                    </>
                )}

                {form.mode === 'ai' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Source PDF (optional)</label>
                        <input type="file" accept=".pdf" onChange={(event) => setForm((prev) => ({ ...prev, source_file: event.target.files?.[0] || null }))} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={onSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Create Lesson Plan</button>
            </div>
        </div>
    </div>
);

const EditLessonPlanModal: React.FC<{
    form: {
        mode: 'manual' | 'ai';
        classroom_id: string;
        title: string;
        description: string;
        duration_minutes: number;
        learning_objectives_text: string;
        activities_text: string;
        materials_needed_text: string;
        assessment_strategy: string;
        homework: string;
        source_file: File | null;
    };
    classrooms: TeacherClassroom[];
    onClose: () => void;
    onSubmit: () => void;
    setForm: React.Dispatch<React.SetStateAction<{
        mode: 'manual' | 'ai';
        classroom_id: string;
        title: string;
        description: string;
        duration_minutes: number;
        learning_objectives_text: string;
        activities_text: string;
        materials_needed_text: string;
        assessment_strategy: string;
        homework: string;
        source_file: File | null;
    }>>;
}> = ({ form, classrooms, onClose, onSubmit, setForm }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Edit Lesson Plan</h2>
                <p className="text-slate-600 mt-1">Updates are sent to `/study-area/lessons/{'{lesson_id}'}`.</p>
            </div>

            <div className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Classroom *</label>
                    <select value={form.classroom_id} onChange={(event) => setForm((prev) => ({ ...prev, classroom_id: event.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                        <option value="">Select classroom</option>
                        {classrooms.map((classroom) => (
                            <option key={classroom.id} value={String(classroom.id)}>{classroom.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                    <input type="text" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                    <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                    <input type="number" min="10" max="240" value={form.duration_minutes} onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: parseInt(event.target.value, 10) || 45 }))} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Learning Objectives (one per line)</label>
                    <textarea value={form.learning_objectives_text} onChange={(event) => setForm((prev) => ({ ...prev, learning_objectives_text: event.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Activities (one per line)</label>
                    <textarea value={form.activities_text} onChange={(event) => setForm((prev) => ({ ...prev, activities_text: event.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Materials Needed (one per line)</label>
                    <textarea value={form.materials_needed_text} onChange={(event) => setForm((prev) => ({ ...prev, materials_needed_text: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Strategy</label>
                    <textarea value={form.assessment_strategy} onChange={(event) => setForm((prev) => ({ ...prev, assessment_strategy: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Homework</label>
                    <textarea value={form.homework} onChange={(event) => setForm((prev) => ({ ...prev, homework: event.target.value }))} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={onSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Update Lesson Plan</button>
            </div>
        </div>
    </div>
);

const CreateSyllabusModal: React.FC<{
    subjects: TeacherSubject[];
    form: {
        title: string;
        description: string;
        subject_id: string;
        term_length_weeks: number;
        textbook_file: File | null;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        title: string;
        description: string;
        subject_id: string;
        term_length_weeks: number;
        textbook_file: File | null;
    }>>;
    onClose: () => void;
    onSubmit: () => void;
}> = ({ subjects, form, setForm, onClose, onSubmit }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Create New Syllabus</h2>
            </div>
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Syllabus Title *</label>
                    <input type="text" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                    <select value={form.subject_id} onChange={(event) => setForm({ ...form, subject_id: event.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Term Length (weeks)</label>
                    <input type="number" min="1" max="52" value={form.term_length_weeks} onChange={(event) => setForm({ ...form, term_length_weeks: parseInt(event.target.value, 10) || 12 })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Textbook PDF (optional)</label>
                    <input type="file" accept=".pdf" onChange={(event) => setForm({ ...form, textbook_file: event.target.files?.[0] || null })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={onSubmit} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg">Create Syllabus</button>
            </div>
        </div>
    </div>
);

const SyllabusDetailsModal: React.FC<{
    syllabus: Syllabus;
    getStatusColor: (status: string) => string;
    getProcessingStatusColor: (status: string) => string;
    onClose: () => void;
}> = ({ syllabus, getStatusColor, getProcessingStatusColor, onClose }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{syllabus.title}</h2>
                    <p className="text-slate-600 mt-1">{syllabus.subject_name}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100">x</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="Syllabus Information">
                    <InfoRow label="Status" value={syllabus.status} pillClass={getStatusColor(syllabus.status)} />
                    <InfoRow label="Duration" value={`${syllabus.term_length_weeks} weeks`} />
                    <InfoRow label="Created" value={new Date(syllabus.created_date).toLocaleDateString()} />
                    <InfoRow label="Last Updated" value={new Date(syllabus.updated_date).toLocaleDateString()} />
                </InfoCard>
                <InfoCard title="AI Processing">
                    <InfoRow label="Status" value={syllabus.ai_processing_status} pillClass={getProcessingStatusColor(syllabus.ai_processing_status)} />
                    <InfoRow label="Textbook" value={syllabus.textbook_filename || 'No textbook uploaded'} />
                    <InfoRow label="Weekly Plans" value={`${syllabus.weekly_plans?.length ?? syllabus.total_weeks ?? 0} generated`} />
                </InfoCard>
            </div>
            {!!syllabus.description && (
                <div className="px-6 pb-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{syllabus.description}</p>
                </div>
            )}
        </div>
    </div>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string; pillClass?: string }> = ({ label, value, pillClass }) => (
    <div className="text-sm flex items-center justify-between gap-2">
        <span className="text-slate-500">{label}</span>
        {pillClass ? <span className={`px-2 py-1 rounded-full text-xs ${pillClass}`}>{value}</span> : <span className="text-slate-900 text-right">{value}</span>}
    </div>
);
