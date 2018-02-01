import { createSelector } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import {
  IReport,
  IReportDetailed,
  INestedRelatedField,
  IField,
  IDisplayField,
  IRelatedField,
  IReportPreview,
  IFilter,
} from '../api.interfaces';
import * as reportActions from '../actions/reports';
import {
  DisplayFieldActions,
  DisplayFieldActionTypes,
} from '../actions/display-field';
import { FilterActions, FilterActionTypes } from '../actions/filter';

export interface State {
  reports: IReport[];
  selectedReport: IReportDetailed | null;
  relatedFields: INestedRelatedField[];
  fields: IField[];
  title: string;
  descriptionInput: string;
  isDistinct: boolean;
  reportPreview?: IReportPreview;
  reportSaved?: Date;
  reportSearchText: string;
  fieldSearchText: string;
  relationsSearchText: string;
  leftNavIsOpen: boolean;
  rightNavIsOpen: boolean;
  activeTab: number;
  displayFields: EntityState<IDisplayField>;
  filters: EntityState<IFilter>;
  selectedField?: IField;
}

export const displayFieldAdapter: EntityAdapter<
  IDisplayField
> = createEntityAdapter<IDisplayField>({
  sortComparer: (x, y) => x.position - y.position,
  selectId: x => x.position,
});

export const filterAdapter: EntityAdapter<IFilter> = createEntityAdapter({
  sortComparer: (x, y) => x.position - y.position,
  selectId: x => x.position,
});

export const initialState: State = {
  reports: [],
  selectedReport: null,
  relatedFields: [],
  fields: [],
  title: '',
  descriptionInput: '',
  isDistinct: false,
  reportSearchText: '',
  fieldSearchText: '',
  relationsSearchText: '',
  leftNavIsOpen: false,
  rightNavIsOpen: false,
  activeTab: 0,
  displayFields: displayFieldAdapter.getInitialState(),
  filters: filterAdapter.getInitialState(),
};

export function reducer(
  state = initialState,
  action: reportActions.Actions | DisplayFieldActions | FilterActions
): State {
  switch (action.type) {
    case reportActions.SET_REPORT_LIST: {
      return {
        ...state,
        reports: action.payload,
      };
    }

    case reportActions.GET_REPORT: {
      return {
        ...state,
        selectedReport: null,
        descriptionInput: initialState.descriptionInput,
      };
    }

    case reportActions.GET_TITLE: {
      return {
        ...state,
        title: action.payload,
      };
    }

    case reportActions.TOGGLE_LEFT_NAV: {
      return {
        ...state,
        leftNavIsOpen: !state.leftNavIsOpen,
      };
    }

    case reportActions.TOGGLE_RIGHT_NAV: {
      return {
        ...state,
        rightNavIsOpen: !state.rightNavIsOpen,
      };
    }

    case reportActions.GET_REPORT_SUCCESS: {
      return {
        ...state,
        selectedReport: action.payload,
        relatedFields: initialState.relatedFields,
        fields: initialState.fields,
        descriptionInput: action.payload.description,
        isDistinct: action.payload.distinct,
      };
    }

    case reportActions.GET_REPORT_FIELDS_SUCCESS: {
      const relatedFields: INestedRelatedField[] = action.payload.relatedFields.map(
        relatedField => {
          return { ...relatedField, children: [] };
        }
      );
      return {
        ...state,
        relatedFields: relatedFields,
        fields: action.payload.fields,
      };
    }

    case reportActions.GET_FIELDS_SUCCESS: {
      return {
        ...state,
        fields: action.payload,
      };
    }

    case reportActions.GET_RELATED_FIELDS_SUCCESS: {
      return {
        ...state,
        relatedFields: state.relatedFields.map(
          populateChildren(action.payload.parent, action.payload.relatedFields)
        ),
      };
    }

    case reportActions.CHANGE_REPORT_DESCRIPTION: {
      return {
        ...state,
        descriptionInput: action.payload,
      };
    }

    case reportActions.TOGGLE_REPORT_DISTINCT: {
      return {
        ...state,
        isDistinct:
          action.payload !== undefined ? action.payload : !state.isDistinct,
      };
    }

    case reportActions.EDIT_REPORT_SUCCESS: {
      return {
        ...state,
        selectedReport: action.payload,
        descriptionInput: action.payload.description,
        isDistinct: action.payload.distinct,
        reportSaved: new Date(),
      };
    }

    case reportActions.GENERATE_PREVIEW_SUCCESS: {
      return {
        ...state,
        reportPreview: action.payload,
      };
    }

    case reportActions.DELETE_REPORT_SUCCESS: {
      return {
        ...state,
        reports: state.reports.filter(r => r.id !== action.reportId),
        selectedReport: initialState.selectedReport,
      };
    }

    case reportActions.DOWNLOAD_EXPORTED_REPORT: {
      return {
        ...state,
        selectedReport: Object.assign({}, state.selectedReport, {
          report_file: action.payload,
          report_file_creation: new Date().toISOString(),
        }),
      };
    }

    case reportActions.SET_REPORT_SEARCH_TEXT: {
      return {
        ...state,
        reportSearchText: action.payload,
      };
    }

    case reportActions.SET_FIELD_SEARCH_TEXT: {
      return {
        ...state,
        fieldSearchText: action.payload,
      };
    }

    case reportActions.SET_RELATIONS_SEARCH_TEXT: {
      return {
        ...state,
        relationsSearchText: action.payload,
      };
    }

    case reportActions.CHANGE_TAB: {
      return {
        ...state,
        activeTab: action.payload,
      };
    }

    case DisplayFieldActionTypes.LOAD_ALL:
      return {
        ...state,
        displayFields: displayFieldAdapter.addAll(
          action.payload,
          state.displayFields
        ),
      };

    case DisplayFieldActionTypes.UPDATE_ONE:
      return {
        ...state,
        displayFields: displayFieldAdapter.updateOne(
          action.payload,
          state.displayFields
        ),
      };

    case DisplayFieldActionTypes.UPDATE_MANY:
      return {
        ...state,
        displayFields: displayFieldAdapter.updateMany(
          action.payload,
          state.displayFields
        ),
      };

    case DisplayFieldActionTypes.DELETE_ONE:
      return {
        ...state,
        displayFields: displayFieldAdapter.removeOne(
          action.payload,
          state.displayFields
        ),
      };

    case FilterActionTypes.LOAD_ALL:
      return {
        ...state,
        filters: filterAdapter.addAll(action.payload, state.filters),
      };

    case FilterActionTypes.UPDATE_ONE:
      return {
        ...state,
        filters: filterAdapter.updateOne(action.payload, state.filters),
      };

    case FilterActionTypes.UPDATE_MANY:
      return {
        ...state,
        filters: filterAdapter.updateMany(action.payload, state.filters),
      };

    case FilterActionTypes.DELETE_ONE:
      return {
        ...state,
        filters: filterAdapter.removeOne(action.payload, state.filters),
      };

    case reportActions.ADD_REPORT_FIELD: {
      switch (getActiveTab(state)) {
        case 0:
          return {
            ...state,
            displayFields: displayFieldAdapter.addOne(
              {
                ...action.payload,
                position: state.displayFields.ids.length,
                report: state.selectedReport.id,
              },
              state.displayFields
            ),
          };
        case 1:
          return {
            ...state,
            filters: filterAdapter.addOne(
              {
                ...action.payload,
                position: state.filters.ids.length,
                report: state.selectedReport.id,
                filter_type: 'exact',
              },
              state.filters
            ),
          };

        default:
          return state;
      }
    }

    case reportActions.SELECT_FIELD: {
      return {
        ...state,
        selectedField: action.payload,
      };
    }

    default:
      return state;
  }
}

function populateChildren(parent: IRelatedField, children: IRelatedField[]) {
  return function replaceField(
    field: INestedRelatedField
  ): INestedRelatedField {
    const replacement = { ...field };
    if (field === parent) {
      replacement.children = [...children].map(child => ({
        ...child,
        children: [],
      }));
    } else {
      replacement.children = replacement.children.map(replaceField);
    }
    return replacement;
  };
}

export const getReports = (state: State) => state.reports;
export const getTitle = (state: State) => state.title;
export const getSelectedReport = (state: State) => state.selectedReport;
export const getSelectedReportId = (state: State) => {
  const report = getSelectedReport(state);
  if (report) {
    return report.id;
  }
};
export const getFields = (state: State) => state.fields;
export const getRelatedFields = (state: State) => state.relatedFields;
export const getDescriptionInput = (state: State) => state.descriptionInput;
export const getIsDistinct = (state: State) => state.isDistinct;
export const getPreview = (state: State) => state.reportPreview;
export const getLastSaved = (state: State) => state.reportSaved;
export const getNewReportInfo = (state: State) => {
  const report = getSelectedReport(state);
  if (report) {
    const { name, description, root_model } = report;
    return { name, description, root_model };
  }
};
export const getLastGeneratedReport = createSelector(
  getSelectedReport,
  selectedReport => {
    if (selectedReport) {
      const { report_file, report_file_creation } = selectedReport;
      return { report_file, report_file_creation };
    }
  }
);
export const getReportSearchTerm = (state: State) => state.reportSearchText;
export const getFieldSearchTerm = (state: State) => state.fieldSearchText;
export const getRelationsSearchTerm = (state: State) =>
  state.relationsSearchText;
export const getLeftNavIsOpen = (state: State) => state.leftNavIsOpen;
export const getRightNavIsOpen = (state: State) => state.rightNavIsOpen;

export const getDisplayFieldsState = (state: State) => state.displayFields;
const {
  selectAll: selectAllDisplayFields,
  selectTotal: selectDisplayFieldsCount,
} = displayFieldAdapter.getSelectors();
export const getDisplayFields = createSelector(
  getDisplayFieldsState,
  selectAllDisplayFields
);
export const getDisplayFieldsCount = createSelector(
  getDisplayFieldsState,
  selectDisplayFieldsCount
);
export const getFiltersState = (state: State) => state.filters;
const {
  selectAll: selectAllFilters,
  selectTotal: selectFiltersCount,
} = filterAdapter.getSelectors();
export const getFilters = createSelector(getFiltersState, selectAllFilters);
export const getFiltersCount = createSelector(
  getFiltersState,
  selectFiltersCount
);
export function getActiveTab(state: State) {
  return state.activeTab;
}

export const getEditedReport = (state: State) => ({
  ...state.selectedReport,
  description: getDescriptionInput(state),
  distinct: getIsDistinct(state),
  displayfield_set: getDisplayFields(state),
  filterfield_set: getFilters(state),
});
export const getSelectedField = (state: State) => state.selectedField;
