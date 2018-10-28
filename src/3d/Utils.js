const Utils = (() => {

    function removeMeshTextures(material) {
        if (material.map) {
            material.map.dispose ();
        }
        if (material.lightMap){
            material.lightMap.dispose ();
        }
        if (material.bumpMap) {
            material.bumpMap.dispose ();
        }
        if (material.normalMap)    material.normalMap.dispose ();
        if (material.specularMap)  material.specularMap.dispose ();
        if (material.envMap)       material.envMap.dispose ();

        material.dispose ();   // disposes any programs associated with the material
    }

    function getOffset(el) {
        const rect = el.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    }

    function doDispose(obj)
    {
        //@TODO make this work properly. Still experiencing JS memory leak
        if (obj)
        {
            if(obj.children && obj.children.length > 0) {
                for (var i = 0; i < obj.children.length; i++)
                {
                    doDispose(obj.children[i]);
                }
            }

            if(obj.geometry) {
                obj.geometry.dispose();
            }
            if(obj.material) {
                if (obj.material.length > 1) {
                    obj.material.forEach((mat) => {
                        removeMeshTextures(mat);
                    });
                } else {
                    removeMeshTextures(obj.material);
                }
            }
        }
        const parent = obj.parent;
        parent.remove(obj);
        obj = undefined;
    }

    return {
        doDispose: doDispose,
        getOffset: getOffset
    }
})();

export default Utils;
