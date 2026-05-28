import type { FC } from "react";

import type { IconProps } from "./Icon";

export type { IconProps } from "./Icon";
export { SqlensLogo } from "./SqlensLogo";
export { HelpTourIcon } from "./HelpTourIcon";
export { AiSqlIcon } from "./AiSqlIcon";
export { PracticeHubIcon } from "./PracticeHubIcon";
export { SchemaTablesIcon } from "./SchemaTablesIcon";
export { ProjectFolderIcon } from "./ProjectFolderIcon";
export { SampleDatabaseIcon } from "./practice/SampleDatabaseIcon";
export { QueryTemplateIcon } from "./practice/QueryTemplateIcon";
export { SqlSnippetIcon } from "./practice/SqlSnippetIcon";
export { VisualizationPresetIcon } from "./practice/VisualizationPresetIcon";

export type AppIconComponent = FC<Pick<IconProps, "size" | "className">>;
