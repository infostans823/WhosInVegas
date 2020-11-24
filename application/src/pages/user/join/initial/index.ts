import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { ToastController, AlertController, NavController, NavParams } from 'ionic-angular';
import { ISubscription } from 'rxjs/Subscription';

// services
import { UserService, IUserData } from 'services/user';
import { SiteConfigsService } from 'services/site-configs';
import { AuthService } from 'services/auth';
// pages
import { JoinQuestionsPage } from 'pages/user/join/questions';
import { BaseFormBasedPage } from 'pages/base.form.based'
import { DashboardPage } from 'pages/dashboard';

// questions
import { QuestionBase } from 'services/questions/questions/base';
import { QuestionManager } from 'services/questions/manager';
import { QuestionControlService } from 'services/questions/control.service';

// components
import { IFileUploadResult } from  'shared/components/file-uploader';
import { FirstSignsInfoPage } from '../first-signs-info/first-signs-info';

@Component({
    selector: 'join-initial',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        QuestionControlService,
        QuestionManager
    ]
})

export class JoinInitialPage extends BaseFormBasedPage implements OnInit, OnDestroy {
    @Input() questions: Array<QuestionBase> = []; // list of questions


    isPageLoading: boolean = false;
    form: FormGroup;
    isAvatarUploadIng: boolean = false;
    avatarUrl: string = null;
    avatarUploadUri = '/avatars';
    sections: any = [];

    private initialData: IUserData;
    private initialDataSignup: IUserData;

    private isAvatarUploaded: boolean = false;
    private avatarKey: string = null;
    private siteConfigsSubscription: ISubscription;

    private loginInProcessing: boolean = false;

    /**
     * Constructor
     */
    constructor(
        public questionControl: QuestionControlService,
        protected toast: ToastController,
        protected siteConfigs: SiteConfigsService,
        protected translate: TranslateService,
        private nav: NavController,
        private alert: AlertController,
        private user: UserService,
        private ref: ChangeDetectorRef,
        private questionManager: QuestionManager,
        private navParams: NavParams,
        private auth: AuthService)
    {
        super(
            questionControl,
            siteConfigs,
            translate,
            toast
        );

        this.initialDataSignup = this.navParams.get('initial');
        console.log("Initiala : ",this.initialDataSignup)
    }

    /**
     * Component init
     */
    ngOnInit(): void {
        // watch configs changes
        this.siteConfigsSubscription = this.siteConfigs.watchConfigGroup([
            'isAvatarRequired',
            'isAvatarHidden',
            'avatarMaxUploadSize',
            'validImageMimeTypes'
        ]).subscribe(() => this.ref.markForCheck());

        this.isPageLoading = true;
        this.ref.markForCheck();

        this.user.loadGenders().subscribe(response => {
            // process genders
            const genderList: Array<{value: any, title: string}> = [];

            response.forEach(gender => genderList.push({
                value: gender.id,
                title: gender.name
            }));

            const questions = this.getQuestionList(genderList);

            // process questions
            questions.forEach(questionData => {
                const data = {
                    section: '',
                    questions: []
                };

                //data.section = questionData.section;
                data.section = "BASIC";

                console.log("questionData.section = ",questionData.section)

                questionData.questions.forEach(question => {
                    const params = question.params ? question.params : {};

                    // create a question
                    const questionItem: QuestionBase = this.questionManager.getQuestion(question.type, {
                        key: question.key,
                        label: question.label,
                        placeholder: question.placeholder,
                        values: question.values,
                        value: question.value
                    }, params);

                    // add validators
                    if (question.validators) {
                        questionItem.validators = question.validators;
                    }

                    data.questions.push(questionItem);
                    this.questions.push(questionItem);
                });

                this.sections.push(data);
            });
                 // load questions
         this.user.loadJoinQuestions(1).subscribe(response => {
            // process questions
            response.questions.forEach(questionData => {
                const data = {
                    section: '',
                    questions: []
                };

                if(questionData.section != "Basic"){
                    data.section = questionData.section;
                }

                questionData.items.forEach(question => {
                    const questionItem:QuestionBase = this.questionManager.getQuestion(question.type, {
                        key: question.key,
                        label: question.label,
                        placeholder: question.placeholder,
                        values: question.values,
                        value: question.value,
                        params: {
                            stacked: true
                        }
                    }, question.params);

                    // add validators
                    if (question.validators) {
                        questionItem.validators = question.validators;
                    }

                    data.questions.push(questionItem);
                    this.questions.push(questionItem);
                });

                this.sections.push(data);
            });
                 // register all questions inside a form group
                this.form = this.questionControl.toFormGroup(this.questions);
                this.isPageLoading = false;
                this.ref.markForCheck();
        });
        });

        ///////////////////////////////////////////////////////////

        
    }

    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        this.siteConfigsSubscription.unsubscribe();
    }

    /**
     * Get avatar mime types
     */
    get getAvatarMimeTypes(): Array<string> {
        return this.siteConfigs.getConfig('validImageMimeTypes');
    }

    /**
     * Get avatar max size
     */
    get getAvatarMaxSize(): Array<string> {
        return this.siteConfigs.getConfig('avatarMaxUploadSize');
    }

    /**
     * Is avatar required
     */
    get isAvatarRequired(): boolean {
        // return this.siteConfigs.getConfig('isAvatarRequired');
        return false
    }

    /**
     * Is avatar hidden
     */
    get isAvatarHidden(): boolean {
        return this.siteConfigs.getConfig('isAvatarHidden');
    }

    /**
     * Is avatar valid
     */
    get isAvatarValid(): boolean {
        // return this.isAvatarHidden
        //     || (!this.isAvatarRequired && !this.isAvatarUploadIng)
        //     || (this.isAvatarUploaded && !this.isAvatarUploadIng);
        return true
    }

    /**
     * Success avatar upload callback
     */
    successAvatarUploadCallback(response: IFileUploadResult): void {
        this.avatarUrl = response.data.url;
        this.avatarKey = response.data.key;

        this.isAvatarUploaded = true;
        this.isAvatarUploadIng = false;
        this.ref.markForCheck();
    }

    /**
     * Error avatar upload callback
     */
    errorAvatarUploadCallback(): void {
        this.isAvatarUploadIng = false;
        this.ref.markForCheck();

        const alert = this.alert.create({
            title: this.translate.instant('error_occurred'),
            subTitle: this.translate.instant('error_uploading_file'),
            buttons: [this.translate.instant('ok')]
        });

        alert.present();
    }

    /**
     * Start uploading avatar callback
     */
    startUploadingAvatarCallback(): void {
        this.isAvatarUploadIng = true;
        this.ref.markForCheck();
    }

    /**
     * Submit form
     */
    submit(): void {
        // is form valid
        if (!this.form.valid || !this.isAvatarValid) {
            // avatar is not uploaded
            if (this.form.valid && !this.isAvatarValid) {
                this.showNotification('avatar_input_error');

                return;
            }

            this.showFormGeneralError(this.form);

            return;
        }

        this.loginInProcessing = true

        const userData1: IUserData = {
            avatarKey: '',
            email: this.form.value.email,
            lookingFor: this.form.value.lookingFor,
            password: this.initialDataSignup.password,
            repeatPassword: this.initialDataSignup.password,
            sex: this.form.value.sex,
            userName: this.initialDataSignup.userName
        }

        this.initialData = {
            ...userData1,
            avatarKey: !this.isAvatarHidden ? this.avatarKey : null
        }

        ////////////////////////////////
        const userData: IUserData = {
            userName: this.initialData.userName,
            email: this.initialData.email,
            password: this.initialData.password,
            sex: this.initialData.sex,
            avatarKey: this.initialData.avatarKey
        }

        this.user.createMe(userData).subscribe(response => {
            // set user authenticated
            this.auth.setAuthenticated(response.token);

            // create questions
            const processedQuestions = [];
            this.questions.forEach(questionData => {
                if(questionData.key == 'email' || questionData.key == 'sex'){
                    return
                }
                processedQuestions.push({
                    name: questionData.key,
                    value: this.form.value[questionData.key],
                    type: questionData.controlType
                });
            });

            // add match sex
            processedQuestions.push({
                name: 'match_sex',
                value: this.initialData.lookingFor,
                type: QuestionManager.TYPE_MULTICHECKBOX
            });

            this.user.createQuestionsData(processedQuestions).subscribe(() => {
                this.loginInProcessing = false;
                this.nav.setRoot(DashboardPage,{isInsiCallFlg:false});
                // this.nav.setRoot(FirstSignsInfoPage);

            });
        });
    }

    /**
     * Get question list
     */
    private getQuestionList(genderList: Array<{value: any, title: string}>): Array<any> {
        return [{
            section: this.translate.instant('base_input_section'),
            questions: [{
                    type: QuestionManager.TYPE_EMAIL,
                    key: 'email',
                    label: this.translate.instant('email_input'),
                    placeholder: this.translate.instant('email_input_placeholder'),
                    validators: [
                        {name: 'require'},
                        {name: 'userEmail'},
                    ],
                    params: {
                        stacked: true
                    }
                }, {
                    type: QuestionManager.TYPE_SELECT,
                    key: 'sex',
                    label: this.translate.instant('gender_input'),
                    values: genderList,
                    validators: [
                        {name: 'require'}
                    ],
                    params: {
                        hideEmptyValue: true
                    }
                }, {
                    type: QuestionManager.TYPE_MULTICHECKBOX,
                    key: 'lookingFor',
                    label: this.translate.instant('looking_for_input'),
                    values: genderList,
                    validators: [
                        {name: 'require'}
                    ]
                }
            ]
        }];
    }
}
