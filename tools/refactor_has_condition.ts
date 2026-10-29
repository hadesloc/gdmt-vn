import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : join(process.cwd(), 'gdmt-vn');
const filePath = join(ROOT_DIR, 'src', 'modules', 'ckd', 'rules.outpatient.ts');
let content = readFileSync(filePath, 'utf8');

// Thay thế các patterns conditions sang hasCondition
content = content.replace(/ctx\.patient\.conditions\?\.onDialysis/g, "hasCondition(ctx, 'onDialysis')");
content = content.replace(/ctx\.patient\.conditions\?\.pregnant/g, "hasCondition(ctx, 'pregnant')");
content = content.replace(/Boolean\(ctx\.patient\.conditions\?\.dm\)/g, "hasCondition(ctx, 'dm')");
content = content.replace(/ctx\.patient\.conditions\?\.dm\b/g, "hasCondition(ctx, 'dm')");
content = content.replace(/Boolean\(ctx\.patient\.conditions\?\.hf\)/g, "hasCondition(ctx, 'hf')");
content = content.replace(/ctx\.patient\.conditions\?\.hf\b/g, "hasCondition(ctx, 'hf')");
content = content.replace(/Boolean\(ctx\.patient\.conditions\?\.htn\)/g, "hasCondition(ctx, 'htn')");
content = content.replace(/ctx\.patient\.conditions\?\.htn\b/g, "hasCondition(ctx, 'htn')");
content = content.replace(/ctx\.patient\.conditions\?\.priorAngioedema/g, "hasCondition(ctx, 'priorAngioedema')");
content = content.replace(/ctx\.patient\.conditions\?\.allergyAceiArb/g, "hasCondition(ctx, 'allergyAceiArb')");
content = content.replace(/Boolean\(ctx\.patient\.conditions\?\.ascvd\)/g, "hasCondition(ctx, 'ascvd')");
content = content.replace(/Boolean\(ctx\.patient\.conditions\?\.strokeOrTia\)/g, "hasCondition(ctx, 'strokeOrTia')");

writeFileSync(filePath, content, 'utf8');
console.log('Đã refactor xong hasCondition trong rules.outpatient.ts!');
