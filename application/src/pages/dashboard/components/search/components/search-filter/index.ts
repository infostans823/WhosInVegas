import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { ToastController, NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormGroup } from '@angular/forms';
import { ISubscription } from 'rxjs/Subscription';

// services
import { SiteConfigsService } from 'services/site-configs';
import { UserService, ISearchFilter, IQuestionResponse, IQuestionStructureResponse } from 'services/user';

// pages
import { BaseFormBasedPage } from 'pages/base.form.based'

// questions
import { QuestionManager } from 'services/questions/manager';
import { QuestionControlService } from 'services/questions/control.service';
import { QuestionBase } from 'services/questions/questions/base';
import { LoginPage } from 'pages/user/login';

@Component({
    selector: 'user-search-filter',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        QuestionControlService,
        QuestionManager
    ]
})

export class UserSearchFilterComponent extends BaseFormBasedPage implements OnInit, OnDestroy {
    @Input() questions: Array<QuestionBase> = []; // list of questions

    form: FormGroup;
    sections: any = [];
    isPageLoading: boolean = true;

    private searchFilters: { [K: string]: any } = {};
    private genderList: Array<{ value: string; title: string }> = [];
    private tripList: Array<{ value: string; title: string }> = [];
    private tripTogge: Array<{ value: boolean; title: string }> = [];
    

    private allSearchQuestions: IQuestionResponse;
    private allSearchOptions: IQuestionResponse;

    private formChangedSubscription: ISubscription;
    private siteConfigsSubscription: ISubscription;

    isInVegasNow: boolean = false;
    

    /**
     * Constructor
     */
    constructor(
        protected questionControl: QuestionControlService,
        protected siteConfigs: SiteConfigsService,
        protected translate: TranslateService,
        protected toast: ToastController,
        private users: UserService,
        private ref: ChangeDetectorRef,
        private view: ViewController,
        private questionManager: QuestionManager,
        private navParams: NavParams) {
        super(
            questionControl,
            siteConfigs,
            translate,
            toast
        );

        const filters: Array<ISearchFilter> = this.navParams.get('filters');

        if (filters.length) {
            filters.forEach(filter => {
                this.searchFilters[filter.name] = filter.value;
            });
        }
    }

    /**
     * Component init
     */
    ngOnInit(): void {
        // watch configs changes
        this.siteConfigsSubscription = this.siteConfigs.watchConfigGroup([
            'showOnlineOnlyInSearch',
            'showWithPhotoOnlyInSearch'
        ]).subscribe(() => {
            if (!this.isPageLoading) {
                // re init the form
                this.initForm();
                this.ref.markForCheck();
            }
        });

        // load page's dependencies
        const dependencies: Observable<any> = Observable.forkJoin(
            this.users.loadGenders(),
            this.users.loadSearchQuestions()
        );

        dependencies.subscribe((data) => {
            const [gendersResponse, questionsResponse] = data;

            this.allSearchQuestions = questionsResponse.questions;
            this.allSearchOptions = questionsResponse.trips;

            // console.log("gendersResponse",gendersResponse);


            // process genders
            gendersResponse.forEach(gender => this.genderList.push({
                value: gender.id,
                title: gender.name
            }));

            //process tripvalue
            this.tripList.push({value:"",title:"Select"})//select value for set null value
            questionsResponse.trips[0].options.forEach(options => this.tripList.push({
                value: options.value,
                title: options.title
            }))

            //process tripToggleValue
            // questionsResponse.trips[1].forEach( val=> this.tripTogge.push({
            //     value: val.value,
            //     title: val.title
            // }))


            // search a default preferred account type
            if (!this.searchFilters['match_sex']) {
                this.searchFilters['match_sex'] = questionsResponse.preferredAccountType;
            }

            // if(!this.searchFilters['during_my_vegas_trip']){
            //     this.searchFilters['during_my_vegas_trip'] = false;
            // }
            this.initForm();

            this.isPageLoading = false;
            this.ref.markForCheck();
        });
    }

    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        if (this.formChangedSubscription) {
            this.formChangedSubscription.unsubscribe();
        }

        this.siteConfigsSubscription.unsubscribe();
    }

    /**
     * Dismiss
     */
    dismiss(): void {
        this.view.dismiss([]);
    }

    /**
     * Close
     */
    close(): void {
        // is form valid
        if (!this.form.valid) {
            this.showFormGeneralError(this.form);

            return;
        }

        const processedQuestions: Array<ISearchFilter> = [];

        this.questions.forEach((questionData: QuestionBase) => {
            processedQuestions.push({
                name: questionData.key,
                value: this.form.value[questionData.key],
                type: questionData.controlType
            });
        });

        this.view.dismiss(processedQuestions);
    }

    /**
     * Is online question active
     */
    get isOnlineQuestionActive(): boolean {
        return this.siteConfigs.getConfig('showOnlineOnlyInSearch');
    }

    /**
     * Is photo question active
     */
    get isPhotoQuestionActive(): boolean {
        return this.siteConfigs.getConfig('showWithPhotoOnlyInSearch');
    }

    /**
     * Init form
     */
    protected initForm(): void {
        if (this.formChangedSubscription) {
            this.formChangedSubscription.unsubscribe();
        }

        this.questions = [];
        this.sections = [];

        const hardCodedQuestions = {
            section: this.translate.instant('advanced_search_input_section'),
            items: []
        };

        // hard coded questions list
        hardCodedQuestions.items.push({
            type: QuestionManager.TYPE_SELECT,
            key: 'match_sex',
            label: this.translate.instant('looking_for_input'),
            values: this.genderList,
            validators: [{
                name: 'require'
            }],
            params: {
                hideEmptyValue: true
            }
        });


        if (this.isOnlineQuestionActive) {
            hardCodedQuestions.items.push({
                type: QuestionManager.TYPE_CHECKBOX,
                key: 'online',
                label: this.translate.instant('online_input'),
                value: false
            });
        }

        if (this.isPhotoQuestionActive) {
            hardCodedQuestions.items.push({
                type: QuestionManager.TYPE_CHECKBOX,
                key: 'with_photo',
                label: this.translate.instant('with_photo_input'),
                value: false
            });
        }

        //In vagas now
        hardCodedQuestions.items.push({
            type: QuestionManager.TYPE_CHECKBOX,
            key: 'in_vegas_now',
            label: 'In Vegas Now!',
            value: false
        });


         //During My Vegas Trip
         hardCodedQuestions.items.push({
            type: QuestionManager.TYPE_SELECT,
            key: 'during_my_vegas_trip',
            label: this.translate.instant('during_my_vegas_trip'),
            values: this.tripList,
            validators: [
                //     {
                //     name: 'require'
                // }
            ],
            params: {
                hideEmptyValue: true
            }
        });

        

        this.processQuestions([hardCodedQuestions]);

        // process search questions
        if (this.allSearchQuestions[this.searchFilters['match_sex']]
                && this.allSearchQuestions[this.searchFilters['match_sex']].length) {

                    this.processQuestions(this.allSearchQuestions[this.searchFilters['match_sex']]);
        }

         // process search questions
        if (this.allSearchOptions[this.searchFilters['during_my_vegas_trip']]
              && this.allSearchOptions[this.searchFilters['during_my_vegas_trip']].length) {

                    this.processQuestions(this.allSearchOptions[this.searchFilters['during_my_vegas_trip']]);
        }

        // register all questions inside a form group
        this.form = this.questionControl.toFormGroup(this.questions);

        // looking for "match_sex" changes
        this.formChangedSubscription = this.form.valueChanges.subscribe(question => {
            console.log("quesition in formchanged",question)

            if (question.match_sex && question.match_sex != this.searchFilters['match_sex']) {
                this.searchFilters = Object.assign({}, this.searchFilters, question);
                this.initForm();

                return;
            }

            if (question.during_my_vegas_trip && question.during_my_vegas_trip != this.searchFilters['during_my_vegas_trip']) {
                this.searchFilters = Object.assign({}, this.searchFilters, question);
                this.initForm();

                return;
            }

            this.searchFilters = Object.assign({}, this.searchFilters, question);
        });


    }

    /**
     * Process questions
     */
    protected processQuestions(questions: Array<{ section: string, items: Array<IQuestionStructureResponse> }>): void {
        questions.forEach(questionData => {
            const data = {
                section: '',
                questions: []
            };

            data.section = questionData.section;

            questionData.items.forEach(question => {
                let questionItem: QuestionBase = null
                console.log(question.label,  "  Key : ",question.key)
                if(question.key == "birthdate"){
                    questionItem = this.questionManager.getQuestion(question.type, {
                        key: question.key,
                        label: "Age",
                        values: question.values,
                        placeholder: question.placeholder,
                        value: this.searchFilters[question.key]
                            ? this.searchFilters[question.key]
                            : question.value
                    }, question.params);
                }else if(question.key == "googlemap_location"){
                    questionItem = this.questionManager.getQuestion(question.type, {
                        key: question.key,
                        label: question.label,
                        values: question.values,
                        placeholder: "Choose location",
                        value: this.searchFilters[question.key]
                            ? this.searchFilters[question.key]
                            : question.value
                    }, question.params);
                }
                else{
                    if(question.key == "in_vegas_now"){
                        console.log("Before : ",this.isInVegasNow)
                        this.isInVegasNow = this.searchFilters[question.key]
                        ? this.searchFilters[question.key]
                        : question.value
                        this.ref.markForCheck()
                        console.log("After : ",this.isInVegasNow)
                    }
                    questionItem = this.questionManager.getQuestion(question.type, {
                        key: question.key,
                        label: question.label,
                        values: question.values,
                        placeholder: question.placeholder,
                        value: this.searchFilters[question.key]
                            ? this.searchFilters[question.key]
                            : question.value
                    }, question.params);
                }
                
                // add validators
                if (question.validators) {
                    questionItem.validators = question.validators;
                }

                data.questions.push(questionItem);
                this.questions.push(questionItem);
            });

            this.sections.push(data);
        });
    }


    isVegasNowEvent(event){
        this.isInVegasNow = event.value;
        console.log("Event : ",event.value);
        this.ref.detectChanges();
    }
}
