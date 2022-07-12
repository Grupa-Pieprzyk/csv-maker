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
export type RenderFnWrapper<T extends Row> = {
  fn: RenderFn<T>
}
export type RendererColumn<T extends Row> = {
  text: string;
  child: RenderFnWrapper<T>;
}

export type Column<T extends Row> = RendererColumn<T> | CosmeticColumn<T>;

export type Config<T extends Row> = {
  columns: Array<Column<T>>;
};

export type FlattenedRow = Array<JSONValue>;

export function isRenderColumn<T extends Row>(column: Column<T>): column is RendererColumn<T> {
  return (column as RendererColumn<T>).child.fn != null;
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

function rotateArray90deg<T>(matrix: Array<Array<T>>): Array<Array<T>> {
  return matrix[0].map((_val, index) => matrix.map(row => row[index]))
}

export function rotate<T>(matrix: Array<Array<T>>, times: number): Array<Array<T>> {
  let m = matrix;
  for (let _ of range(times)) {
    m = rotateArray90deg(m);
  }
  return m;
}

export function getHeaders<T extends Row>(config: Config<T>): Array<FlattenedRow> {
  const paths = config.columns.flatMap(getPaths);
  const longest = Math.max(...[...paths.map((v) => v.length)]);
  return paths.map((path) => path.reverse()).map((path) => [...path, ...range(longest - path.length).map(() => null)]).map((path) => path.reverse())
}

export function getRow<T extends Row>(row: T, config: Config<T>): FlattenedRow {
  return config.columns.flatMap(flattenRenderer).flatMap(({ child }) => child.fn(row));
}

export function getValues<T extends Row>(data: T[], config: Config<T>): Array<FlattenedRow> {
  return data.map((row) => getRow(row, config));
}

export function toCSV<T extends Row>(data: T[], config: Config<T>): Array<FlattenedRow> {
  const rendered =
    [
      ...rotate(getHeaders(config), 1),
      ...getValues(data, config),
    ];
  console.debug(dummyRender(rendered))
  return rendered
}

export function dummyRender(csv: Array<FlattenedRow>): string {
  return csv.map((row) => row.join(",")).join("\n")
}

