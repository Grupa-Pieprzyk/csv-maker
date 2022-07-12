import { } from 'papaparse';


export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> { }

export type Row = JSONObject;

export type RenderFn<T extends Row> = (v: T) => JSONPrimitive;

export type CosmeticColumn<T extends Row> = {
  text: string;
  child: Array<Column<T>>;
}
type RenderFnWrapper<T extends Row> = {
  renderFn: RenderFn<T>
}
type RendererColumn<T extends Row> = {
  text: string;
  child: RenderFnWrapper<T>;
}

type Column<T extends Row> = RendererColumn<T> | CosmeticColumn<T>;

export type Config<T extends Row> = {
  columns: Array<Column<T>>;
};

type FlattenedRow = Array<JSONValue>;

// function isCosmeticColumn<T extends Row>(column: Column<T>): column is CosmeticColumn<T> {
//   const isCosmetic = (column as CosmeticColumn<T>).child.length == null;
//   return isCosmetic;
// }

function isRenderColumn<T extends Row>(column: Column<T>): column is RendererColumn<T> {
  return (column as RendererColumn<T>).child.renderFn != null;
  // const isItReally = !isCosmeticColumn(column);
  // console.debug({ column, isItReally });
  // return isItReally;
}

export function getPaths<T extends Row>(column: Column<T>): Array<string[]> {
  if (isRenderColumn(column)) return [[column.text]];
  return column.child.map((child) => getPaths(child).flatMap((end) => [column.text, ...end]));
}

function range(length: number): number[] {
  const range = [];
  for (let i = 0; i < length; i++) {
    range.push(i);
  }
  return range;
}

export function flattenRenderer<T extends Row>(column: Column<T>): Array<RendererColumn<T>> {
  if (isRenderColumn(column)) return [column];
  return column.child.flatMap((child) => flattenRenderer(child));
}


function getHeaders<T extends Row>(config: Config<T>): Array<FlattenedRow> {
  const paths = config.columns.flatMap(getPaths);
  const longest = Math.max(...[...paths.map((v) => v.length)]);
  return paths.map((path) => path.reverse()).map((path) => [...path, ...range(longest - path.length).map(() => null)]).map((path) => path.reverse())
}

export function toCSV<T extends Row>(data: T[], config: Config<T>): Array<FlattenedRow> {
  const headers = getHeaders(config);
  const values = data.map((v) => config.columns.flatMap(flattenRenderer).flatMap(({ child }) => child.renderFn(v)));
  return [
    ...headers,
    ...values,
  ]
}

export function dummyRender(csv: Array<FlattenedRow>): string {
  return csv.map((row) => row.join(",")).join("\n")
}

