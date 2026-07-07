const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

code = code.replace(
`    } catch (err: any) {
      console.error("Camera error:", err);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {`,
`    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission') || err?.message?.includes('denied')) {`
);

code = code.replace(
`      } catch (error: any) {
        console.error("Error accessing microphone:", error);
        if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {`,
`      } catch (error: any) {
        if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission') || error?.message?.includes('denied')) {`
);

fs.writeFileSync('src/components/MainApp.tsx', code);
console.log("Patched errors.");
