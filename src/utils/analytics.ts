import * as amplitude from '@amplitude/analytics-browser';

const API_KEY = 'baff53dc99dc463b63254ba8159141d0';

export function initAnalytics(telegramUserId?: number) {
  amplitude.init(API_KEY, telegramUserId ? String(telegramUserId) : undefined, {
    defaultTracking: false,
  });
}

function track(event: string, props?: Record<string, unknown>) {
  amplitude.track(event, props);
}

export const analytics = {
  appOpen: () =>
    track('app_open'),

  garageViewed: (carCount: number) =>
    track('garage_viewed', { car_count: carCount }),

  carViewed: (carId: string) =>
    track('car_viewed', { car_id: carId }),

  tabSwitched: (carId: string, tab: 'history' | 'plan') =>
    track('tab_switched', { car_id: carId, tab }),

  carCreated: (make: string, engineType: string) =>
    track('car_created', { make, engine_type: engineType }),

  carEdited: (carId: string) =>
    track('car_edited', { car_id: carId }),

  carDeleted: (carId: string) =>
    track('car_deleted', { car_id: carId }),

  recordCreated: (carId: string, title: string, linkedPlan: boolean) =>
    track('record_created', { car_id: carId, title, linked_plan: linkedPlan }),

  recordEdited: (carId: string) =>
    track('record_edited', { car_id: carId }),

  recordDeleted: (carId: string) =>
    track('record_deleted', { car_id: carId }),

  planCreated: (carId: string, title: string) =>
    track('plan_created', { car_id: carId, title }),

  planEdited: (carId: string) =>
    track('plan_edited', { car_id: carId }),

  planDeleted: (carId: string) =>
    track('plan_deleted', { car_id: carId }),

  planExecuted: (carId: string, planTitle: string) =>
    track('plan_executed', { car_id: carId, plan_title: planTitle }),

  mileageUpdated: (carId: string) =>
    track('mileage_updated', { car_id: carId }),

  sharePageOpened: (carId: string) =>
    track('share_page_opened', { car_id: carId }),

  shareLinkGenerated: (carId: string) =>
    track('share_link_generated', { car_id: carId }),

  shareSent: (carId: string) =>
    track('share_sent', { car_id: carId }),

  descriptionViewed: (carId: string, hasDescription: boolean) =>
    track('description_viewed', { car_id: carId, has_description: hasDescription }),

  descriptionGenerated: (carId: string) =>
    track('description_generated', { car_id: carId }),

  descriptionSaved: (carId: string) =>
    track('description_saved', { car_id: carId }),

  suggestionsRequested: (carId: string) =>
    track('suggestions_requested', { car_id: carId }),
};
