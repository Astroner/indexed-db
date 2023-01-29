import { DBModel, DBModelBasicTables } from "../db-model.class";

const recursionEvaluation = (
    currentModel: DBModel<DBModelBasicTables, any>,
    versionsDiff: number,
    state: any,
): any => {
    if (!currentModel.migrate) return null;
    if (versionsDiff === 1) {
        return currentModel.migrate(state);
    }
    
    if (!currentModel.prevModel) return null;

    const prevModelMigrationResult = recursionEvaluation(
        currentModel.prevModel, 
        versionsDiff - 1, 
        state,
    );

    if (!prevModelMigrationResult) return null;
    return currentModel.migrate(prevModelMigrationResult);
};

export const evaluateFromOldVersion = (
    currentModel: DBModel<DBModelBasicTables, any>, 
    originVersion: number,
    state: any,
): any => recursionEvaluation(
    currentModel, 
    currentModel.version - originVersion, 
    state,
);
